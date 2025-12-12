import { PROVENIQ_DNA } from "@/lib/config";
import { validateDocSlug, getDocTitle } from "@/lib/mdx";
import { notFound } from "next/navigation";

interface PageProps {
    params: {
        slug: string;
    };
}

export function generateStaticParams() {
    return PROVENIQ_DNA.products.map((product) => ({
        slug: product.docSlug,
    }));
}

export default function DocPage({ params }: PageProps) {
    // STRICT DNA VALIDATION
    if (!validateDocSlug(params.slug)) {
        notFound();
    }

    const title = getDocTitle(params.slug);

    return (
        <article className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-8 p-4 border border-yellow-900/50 bg-yellow-950/10 rounded">
                <h1 className="text-2xl font-bold text-yellow-500 mb-2">Pending Documentation</h1>
                <p className="text-slate-400">
                    The documentation for <span className="text-white font-mono">{title}</span> ({params.slug})
                    is currently being ingested by the Antigravity Kernel.
                </p>
            </div>
            <div className="h-64 rounded bg-slate-900/50 animate-pulse" />
        </article>
    );
}
