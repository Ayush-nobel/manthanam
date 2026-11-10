import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control =
    "mt-1.5 block w-full border border-line-strong bg-white px-3 py-2 text-base text-ink focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal";
const labelText = "text-sm font-semibold text-ink";

export function Field({ label, hint, ...props }: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block">
            <span className={labelText}>{label}</span>
            {hint && <span className="block text-sm text-faint">{hint}</span>}
            <input {...props} className={`${control} min-h-11`} />
        </label>
    );
}

export function Select({ label, children, ...props }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <label className="block">
            <span className={labelText}>{label}</span>
            <select {...props} className={`${control} min-h-11`}>
                {children}
            </select>
        </label>
    );
}

export function TextArea({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <label className="block">
            <span className={labelText}>{label}</span>
            <textarea {...props} className={control} />
        </label>
    );
}
