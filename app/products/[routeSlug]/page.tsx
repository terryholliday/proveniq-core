import { PROVENIQ_DNA } from "@/lib/config";
import { notFound } from "next/navigation";

// Enforcing stricter type safety for the dynamic route
interface PageProps {
    params: {
        routeSlug: string;
    };
}

export function generateStaticParams() {
    return PROVENIQ_DNA.products
        .filter((p) => p.type === "Software")
        .map((product) => ({
            routeSlug: product.routeSlug,
        }));
}

export default function ProductPage({ params }: PageProps) {
    const product = PROVENIQ_DNA.products.find(
        (p) => p.routeSlug === params.routeSlug && p.type === "Software"
    );

    if (!product) {
        notFound();
    }

    return (
        <main className="min-h-screen p-8 text-white bg-slate-950">
            <h1 className="text-4xl font-bold">{product.label}</h1>
            <p className="mt-4 text-xl text-slate-400">{product.role}</p>
            <div className="mt-8">
                <span className="px-3 py-1 text-sm rounded bg-slate-900 border border-slate-800">
                    {product.type}
                </span>
            </div>
        </main>
    );
}
