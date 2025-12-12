import { PROVENIQ_DNA } from "@/lib/config";
import { Flywheel } from "@/components/visualizations/Flywheel";

export default function MarketingPage() {
    return (
        <div className="flex flex-col min-h-full">
            <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-8 text-center overflow-hidden">

                {/* Hero Content */}
                <div className="z-10 max-w-4xl space-y-6">
                    <h1 className="text-5xl font-bold tracking-tighter sm:text-7xl">
                        <span className="block text-white">Institutional Grade</span>
                        <span className="block text-sky-500">Asset Financialization</span>
                    </h1>
                    <p className="mx-auto text-xl text-slate-400 max-w-2xl text-balance">
                        The operating system for the next generation of capital.
                        Connecting real-world value to digital liquidity.
                    </p>
                </div>

                {/* Visualization */}
                <div className="w-full max-w-5xl mt-12 opacity-90">
                    <Flywheel />
                </div>

                {/* Background Gradient */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
            </section>

            <section className="grid grid-cols-1 gap-8 px-8 py-20 md:grid-cols-2 lg:grid-cols-4 bg-slate-950/50">
                {PROVENIQ_DNA.products.slice(0, 4).map((product) => (
                    <div key={product.id} className="p-6 border rounded-lg border-slate-800 bg-slate-900/50">
                        <div className="mb-4 text-xs font-mono text-sky-500 uppercase tracking-widest">{product.role}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{product.label}</h3>
                        <div className="text-sm text-slate-500">
                            {product.type} Module
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
