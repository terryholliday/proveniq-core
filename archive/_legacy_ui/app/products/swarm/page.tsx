"use client";

import React, { useState, useEffect } from "react";
import { PROVENIQ_DNA } from "@/lib/config";
import { SentinelStatus } from "@/components/agents/SentinelStatus";
import { WIDGET_REGISTRY } from "@/lib/nexus/registry";

export default function SwarmPage() {
    // Note: DNA might not have 'swarm' product yet as we didn't add it to PROVENIQ_DNA manually in Step 0.
    // For now we assume a generic header or extend DNA mentally.
    // But honestly, we should probably stick to the pattern.
    // Let's assume this is part of "CORE" or extensive.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6 overflow-y-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">SENTINEL SWARM</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">DeFAI Layer // Autonomous Execution Environment</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>ACTIVE AGENTS: <span className="text-emerald-500">1</span></div>
                    <div>TOTAL VALUE MANAGED: <span className="text-white">$4.2M</span></div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* Main Agent Visualization */}
                {mounted && <SentinelStatus />}

                {/* Agent Configuration / Thesis (Skeleton for now) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 opacity-75">
                    <h3 className="text-lg font-bold text-white mb-4">ACTIVE THESIS: YIELD_HUNT_V4</h3>
                    <div className="space-y-2 text-sm text-slate-400 font-mono">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>TRIGGER_CONDITION</span>
                            <span className="text-sky-500">US_TREASURY_YIELD &lt; 4.0%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>ACTION</span>
                            <span className="text-emerald-500">ACCUMULATE_RWA_TOKENS</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span>MAX_SLIPPAGE</span>
                            <span className="text-amber-500">0.05%</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span>SIGNER</span>
                            <span className="text-violet-500">LIT_PROTOCOL_PKP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
