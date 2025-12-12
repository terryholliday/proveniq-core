import { PROVENIQ_DNA } from "@/lib/config";
import { CoreNetwork } from "@/components/visualizations/CoreNetwork";
import { ApiConsole } from "@/components/ApiConsole";

export default function CorePage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "core");

    return (
        <div className="min-h-screen p-8 bg-slate-950 text-white space-y-12">
            <header>
                <h1 className="text-4xl font-bold mb-2">{product?.label || "Core"}</h1>
                <p className="text-xl text-slate-400 max-w-2xl">{product?.role || "Orchestration"}</p>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-6 text-sky-500">Live Orchestration</h2>
                    <CoreNetwork />
                    <p className="mt-4 text-sm text-slate-500">
                        Real-time visualizer of the asset state machine. Packets represent cryptographic handshakes between ingestion and verification layers.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-6 text-emerald-500">System Logs</h2>
                    <ApiConsole />
                    <div className="mt-8 p-6 border border-slate-800 rounded bg-slate-900/30">
                        <h3 className="font-bold text-white mb-2">Technical Specs</h3>
                        <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
                            <li>Distributed DAG consensus</li>
                            <li>Sub-millisecond latency</li>
                            <li>Quantum-resistant signatures</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
