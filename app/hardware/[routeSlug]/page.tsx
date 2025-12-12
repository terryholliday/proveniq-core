import { PROVENIQ_DNA } from "@/lib/config";
import { notFound } from "next/navigation";

interface PageProps {
    params: {
        routeSlug: string;
    };
}

export function generateStaticParams() {
    return PROVENIQ_DNA.products
        .filter((p) => p.type === "Hardware")
        .map((product) => ({
            routeSlug: product.routeSlug,
        }));
}

export default function HardwarePage({ params }: PageProps) {
    const hardware = PROVENIQ_DNA.products.find(
        (p) => p.routeSlug === params.routeSlug && p.type === "Hardware"
    );

    if (!hardware) {
        notFound();
    }

    return (
        <main className="min-h-screen p-8 text-white bg-slate-950">
            <h1 className="text-4xl font-bold">{hardware.label}</h1>
            <p className="mt-4 text-xl text-slate-400">{hardware.role}</p>
            <div className="mt-8">
                <span className="px-3 py-1 text-sm rounded bg-slate-900 border border-slate-800">
                    {hardware.type}
                </span>
            </div>
        </main>
    );
}
