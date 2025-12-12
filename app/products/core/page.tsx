import { PROVENIQ_DNA } from "@/lib/config";
import { CoreNetwork } from "@/components/visualizations/CoreNetwork";
import { ApiConsole } from "@/components/ApiConsole";
import { ExplainPanel } from "@/components/core/ExplainPanel";
import { AssetInputs, DecisionResponse } from "@/lib/core/types";
import { PolicyCompare } from "@/components/core/PolicyCompare";
// @ts-ignore
import React, { useEffect, useState } from "react";

export default function CorePage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "core");
    const [analysis, setAnalysis] = useState<DecisionResponse | null>(null);

    // Simulate a fresh analysis on mount via Authority API
    useEffect(() => {
        const demoAssetId = "DEMO-ASSET-099";

        // 1. Simulate Input Gathering (Raw Data)
        const inputs: AssetInputs = {
            opticalMatch: 0.98,
            serialMatch: true,
            custodyEvents: 8,
            custodyGaps: false,
            conditionRating: 'A',
            marketVolume: 250000,
            tamperEvents: 0,
            geoMismatch: false
        };

        // 2. Call Core Authority API (System of Record)
        async function verify() {
            try {
                const res = await fetch('/api/core/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assetId: demoAssetId,
                        inputs,
                        policyId: "insurer_policy_v1"
                    })
                });
                const data = await res.json();
                if (data.error) console.error(data.error);
                else setAnalysis(data);
            } catch (e) {
                console.error("Verification Failed", e);
            }
        }

        verify();
    }, []);

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

                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold mb-6 text-emerald-500">System Logs</h2>
                        <ApiConsole />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-6 text-amber-500">Authority Engine</h2>
                    <p className="mb-4 text-sm text-slate-400 max-w-2xl">
                        Deterministic scoring and explainability layer. This panel answers "Why?" for every decision.
                    </p>
                    {analysis && <ExplainPanel analysis={analysis} />}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-8 pb-20">
                <PolicySimulator />
            </section>
        </div>
    );
}
