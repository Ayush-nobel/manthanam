"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { isProofType, MAX_PROOF_BYTES, validatePayment, type PaymentErrors, type PaymentValues } from "@/lib/payment";
import { site } from "@/lib/site";

type Field = keyof PaymentErrors;
const ORDER: Field[] = ["reference", "amount", "paidOn", "payerName", "proof"];
const NAMES: Record<Field, string> = {
    reference: "Transaction ID",
    amount: "Amount paid",
    paidOn: "Date paid",
    payerName: "Paid by",
    proof: "Screenshot",
};

const inputBase =
    "mt-1 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-lg text-ink placeholder:text-faint transition-colors focus:outline-none focus-visible:border-b-2 disabled:opacity-60";
const MB = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/**
 * Phone photos are often bigger than the server takes, or in a format it doesn't (HEIC). Redraw them as a
 * JPEG no larger than 2400 px on the long side; a screenshot stays perfectly readable.
 */
async function shrink(file: File): Promise<File | null> {
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        for (const q of [0.85, 0.7, 0.55]) {
            const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", q));
            if (blob && blob.size <= MAX_PROOF_BYTES) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        }
        return null;
    } catch {
        return null;
    }
}

/** `today` (YYYY-MM-DD, India) comes from the server, which renders this page per request. */
export default function PaymentForm({ token, suggestedAmount, resubmit, today }: { token: string; suggestedAmount: number | null; resubmit: boolean; today: string }) {
    const uid = useId();
    const id = (f: string) => `${uid}-${f}`;
    const [errors, setErrors] = useState<PaymentErrors>({});
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [emailedTo, setEmailedTo] = useState("");
    const [failure, setFailure] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preparing, setPreparing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const summaryRef = useRef<HTMLDivElement>(null);
    const doneRef = useRef<HTMLDivElement>(null);
    const focusSummary = useRef(false);

    useEffect(() => {
        if (done) doneRef.current?.focus();
    }, [done]);
    useEffect(() => {
        if (focusSummary.current && !sending) {
            summaryRef.current?.focus();
            focusSummary.current = false;
        }
    }, [sending, errors]);
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );

    const clear = (f: Field) => {
        if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
    };

    async function choose(picked: File | undefined) {
        clear("proof");
        setFile(null);
        setPreview(null);
        if (!picked) return;
        let ready: File | null = picked;
        const isImage = picked.type.startsWith("image/") || /\.(heic|heif)$/i.test(picked.name);
        if (isImage && (picked.size > MAX_PROOF_BYTES || !isProofType(picked.type))) {
            setPreparing(true);
            ready = await shrink(picked);
            setPreparing(false);
            if (!ready) {
                setErrors((e) => ({ ...e, proof: "This photo couldn’t be read. Take a regular screenshot (PNG or JPG) and choose that instead." }));
                return;
            }
        } else if (!isProofType(picked.type)) {
            setErrors((e) => ({ ...e, proof: "Choose a screenshot or photo (JPG, PNG or WebP) or a PDF receipt." }));
            return;
        } else if (picked.size > MAX_PROOF_BYTES) {
            setErrors((e) => ({ ...e, proof: `This file is ${MB(picked.size)}; the limit is 4 MB. A screenshot instead of the PDF will be smaller.` }));
            return;
        }
        setFile(ready);
        if (ready.type.startsWith("image/")) setPreview(URL.createObjectURL(ready));
    }

    function show(found: PaymentErrors) {
        setErrors(found);
        focusSummary.current = true;
        setSending(false);
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (preparing) return;
        const data = new FormData(e.currentTarget);
        const values: PaymentValues = {
            reference: String(data.get("reference") ?? "").trim(),
            amount: String(data.get("amount") ?? "").trim(),
            paidOn: String(data.get("paidOn") ?? "").trim(),
            payerName: String(data.get("payerName") ?? "").trim(),
        };
        const found = validatePayment(values);
        if (!file) found.proof = errors.proof ?? "Choose the screenshot of your payment.";
        setFailure("");
        if (Object.keys(found).length) return show(found);

        setErrors({});
        setSending(true);
        const body = new FormData();
        body.set("token", token);
        for (const [k, v] of Object.entries(values)) body.set(k, v);
        body.set("proof", file!, file!.name);
        try {
            const res = await fetch("/api/payment", { method: "POST", body });
            const out = (await res.json().catch(() => null)) as { ok?: boolean; email?: string; errors?: PaymentErrors; error?: string } | null;
            if (res.ok && out?.ok) {
                setEmailedTo(out.email ?? "");
                setDone(true);
                setSending(false);
                window.scrollTo({ top: 0 });
                return;
            }
            if (out?.errors && Object.keys(out.errors).length) return show(out.errors);
            setFailure(out?.error ?? "We couldn’t save your payment details right now.");
        } catch {
            setFailure("We couldn’t send this. Check your connection and try again; nothing you typed has been lost.");
        }
        setSending(false);
    }

    if (done) {
        return (
            <div ref={doneRef} tabIndex={-1} role="status" className="border-[5px] border-double border-ink bg-paper px-6 py-8 outline-none sm:px-10 sm:py-10">
                <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-[650] leading-[1.05] text-ink [font-stretch:118%]">Payment details received.</h2>
                <p className="mt-6 max-w-[34rem] text-lg text-ink">Thank you. We check every payment by hand and will confirm your place by email.</p>
                {emailedTo && (
                    <p className="mt-4 max-w-[34rem] text-base text-muted-ink">
                        We&rsquo;ve emailed a receipt to <span className="text-ink">{emailedTo}</span>. If it isn&rsquo;t in your inbox in a few minutes, check your spam folder.
                    </p>
                )}
                <p className="mt-4 max-w-[34rem] text-base text-muted-ink">
                    Sent the wrong screenshot? Open the link in your email again and upload the right one; it replaces this one.
                </p>
            </div>
        );
    }

    const errorList = ORDER.filter((f) => errors[f]);
    const border = (f: Field) => (errors[f] ? "border-destructive" : "border-ink/40 focus:border-signal");
    const described = (f: Field, hint = false) => [hint ? id(`${f}-hint`) : null, errors[f] ? id(`${f}-err`) : null].filter(Boolean).join(" ") || undefined;
    const errText = (f: Field) =>
        errors[f] ? (
            <p id={id(`${f}-err`)} className="mt-2 text-sm text-destructive">
                {errors[f]}
            </p>
        ) : null;
    const busy = sending || preparing;

    return (
        <form noValidate onSubmit={onSubmit} aria-busy={sending} className="grid gap-12">
            {errorList.length > 0 && (
                <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby={id("summary")} className="border-l-4 border-destructive bg-paper px-5 py-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive">
                    <h2 id={id("summary")} className="font-display text-lg font-semibold text-ink [font-stretch:112%]">
                        {errorList.length === 1 ? "One thing to fix" : `${errorList.length} things to fix`}
                    </h2>
                    <ul className="mt-2 grid gap-1 text-base">
                        {errorList.map((f) => (
                            <li key={f}>
                                <a href={`#${id(f)}`} className="text-destructive underline underline-offset-4">
                                    {NAMES[f]}: {errors[f]}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <fieldset className="min-w-0">
                <legend className="w-full border-b border-ink pb-3 font-display text-[1.375rem] font-[620] text-ink [font-stretch:112%]">
                    {resubmit ? "Upload a new screenshot" : "Your payment"}
                </legend>
                <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label htmlFor={id("reference")} className="text-sm font-medium text-ink">
                            Transaction ID, UTR or UPI reference
                        </label>
                        <input
                            id={id("reference")}
                            name="reference"
                            autoComplete="off"
                            spellCheck={false}
                            maxLength={48}
                            disabled={busy}
                            aria-invalid={!!errors.reference}
                            aria-describedby={described("reference", true)}
                            onChange={() => clear("reference")}
                            className={`${inputBase} ${border("reference")} font-mono tracking-[0.04em]`}
                        />
                        <p id={id("reference-hint")} className="mt-2 text-sm text-faint">
                            Shown on the payment confirmation in your UPI app or bank statement, often 12 digits.
                        </p>
                        {errText("reference")}
                    </div>
                    <div>
                        <label htmlFor={id("amount")} className="text-sm font-medium text-ink">
                            Amount paid (₹)
                        </label>
                        <input
                            id={id("amount")}
                            name="amount"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={12}
                            defaultValue={suggestedAmount ?? undefined}
                            disabled={busy}
                            aria-invalid={!!errors.amount}
                            aria-describedby={described("amount")}
                            onChange={() => clear("amount")}
                            className={`${inputBase} ${border("amount")}`}
                        />
                        {errText("amount")}
                    </div>
                    <div>
                        <label htmlFor={id("paidOn")} className="text-sm font-medium text-ink">
                            Date paid
                        </label>
                        <input
                            id={id("paidOn")}
                            name="paidOn"
                            type="date"
                            max={today}
                            disabled={busy}
                            aria-invalid={!!errors.paidOn}
                            aria-describedby={described("paidOn")}
                            onChange={() => clear("paidOn")}
                            className={`${inputBase} ${border("paidOn")} [color-scheme:light]`}
                        />
                        {errText("paidOn")}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor={id("payerName")} className="text-sm font-medium text-ink">
                            Paid by <span className="font-normal text-faint">(only if someone else paid)</span>
                        </label>
                        <input
                            id={id("payerName")}
                            name="payerName"
                            autoComplete="off"
                            maxLength={100}
                            disabled={busy}
                            aria-invalid={!!errors.payerName}
                            aria-describedby={described("payerName", true)}
                            onChange={() => clear("payerName")}
                            className={`${inputBase} ${border("payerName")}`}
                        />
                        <p id={id("payerName-hint")} className="mt-2 text-sm text-faint">
                            The name the payment shows, for example a parent or your college, so we can match it.
                        </p>
                        {errText("payerName")}
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor={id("proof")} className="text-sm font-medium text-ink">
                            Screenshot of the payment
                        </label>
                        <p id={id("proof-hint")} className="mt-1 text-sm text-faint">
                            It should show the amount, the date and the transaction ID. JPG, PNG or PDF, up to 4 MB. You can crop out your balance.
                        </p>
                        <input
                            id={id("proof")}
                            name="proof"
                            type="file"
                            accept="image/*,application/pdf"
                            disabled={busy}
                            aria-invalid={!!errors.proof}
                            aria-describedby={described("proof", true)}
                            onChange={(e) => choose(e.currentTarget.files?.[0])}
                            className={`mt-3 block w-full text-base text-ink file:mr-4 file:min-h-11 file:cursor-pointer file:border file:border-ink file:bg-white file:px-4 file:font-semibold file:text-ink hover:file:bg-paper ${errors.proof ? "text-destructive" : ""}`}
                        />
                        {preparing && (
                            <p className="mt-2 text-sm text-muted-ink" role="status">
                                Preparing the image…
                            </p>
                        )}
                        {file && !preparing && (
                            <div className="mt-4 flex items-start gap-4">
                                {preview && (
                                    // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file
                                    <img src={preview} alt="The screenshot you chose" className="max-h-56 w-auto border border-line" />
                                )}
                                <p className="text-sm text-muted-ink">
                                    {file.name}, {MB(file.size)}
                                </p>
                            </div>
                        )}
                        {errText("proof")}
                    </div>
                </div>
            </fieldset>

            {failure && (
                <div role="alert" className="border-t-2 border-destructive pt-3 text-base text-ink">
                    {failure} If it keeps happening, reply to the payment email with your screenshot attached, or write to{" "}
                    <a href={`mailto:${site.email}`} className="font-medium text-signal underline underline-offset-2">
                        {site.email}
                    </a>
                    .
                </div>
            )}

            <div>
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 bg-ink px-8 py-3.5 font-display text-base font-semibold text-paper [font-stretch:112%] transition-colors hover:bg-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-70"
                >
                    {sending ? (
                        <>
                            Sending…
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        </>
                    ) : (
                        "Send payment details"
                    )}
                </button>
                <p className="mt-3 text-sm text-faint">
                    We use these details only to check your payment. See our{" "}
                    <a href="/privacy" className="underline underline-offset-2">
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </form>
    );
}
