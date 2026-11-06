import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw HTML in Markdown is not rendered (react-markdown's safe default).
const components: Components = {
    h2: (p) => <h2 className="mt-12 font-display text-[1.75rem] font-[620] leading-tight text-ink [font-stretch:115%]" {...p} />,
    h3: (p) => <h3 className="mt-10 font-display text-xl font-[620] text-ink [font-stretch:112%]" {...p} />,
    p: (p) => <p className="mt-5 leading-relaxed text-ink/85" {...p} />,
    a: ({ href = "", ...p }) => {
        const external = /^https?:\/\//.test(href);
        return (
            <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-signal underline decoration-signal/40 underline-offset-2 hover:decoration-signal"
                {...p}
            />
        );
    },
    ul: (p) => <ul className="mt-5 list-disc space-y-2 pl-6 text-ink/85 marker:text-signal" {...p} />,
    ol: (p) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-ink/85 marker:text-faint" {...p} />,
    blockquote: (p) => <blockquote className="my-10 text-2xl italic leading-snug text-ink [&>p]:mt-0 [&>p]:text-ink" {...p} />,
    code: (p) => <code className="bg-paper-3 px-1.5 py-0.5 font-mono text-[0.9em] text-ink" {...p} />,
    hr: () => <hr className="my-12 border-line" />,
    table: (p) => (
        <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" {...p} />
        </div>
    ),
    th: (p) => <th className="border-b border-line py-2 pr-4 font-medium text-ink" {...p} />,
    td: (p) => <td className="border-b border-line py-2 pr-4 text-muted-ink" {...p} />,
};

export default function Markdown({ children }: { children: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {children}
        </ReactMarkdown>
    );
}
