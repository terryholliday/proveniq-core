"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AssetInputs, Decision, DecisionResponse } from '@/lib/core/types';
import { PROVENIQ_DNA } from '@/lib/config';

// Pre-defined scenarios to prove differentiation
const SCENARIOS = [
    {
        id: 'gold_standard',
        label: 'Pristine Asset',
        desc: 'Good Condition, Fresh Verification',
        inputs: {
            opticalMatch: 0.99,
            serialMatch: true,
            custodyEvents: 10,
            custodyGaps: false,
            conditionRating: 'A',
            marketVolume: 50000,
            tamperEvents: 0,
            geoMismatch: false,
            conditionReportDate: new Date() // Today
        } as AssetInputs
    },
    {
        id: 'stale_asset',
        label: 'Stale Asset',
        desc: 'Good Condition but Old Verification (100 days)',
        inputs: {
            opticalMatch: 0.98,
            serialMatch: true,
            custodyEvents: 10,
            custodyGaps: false,
            conditionRating: 'A',
            marketVolume: 50000,
            tamperEvents: 0,
            geoMismatch: false,
            conditionReportDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100) // 100 days old
        } as AssetInputs
    },
    {
        id: 'illiquid_asset',
        label: 'Illiquid Niche',
        desc: 'Verified Identity but Low Market Volume',
        inputs: {
            opticalMatch: 0.99,
            serialMatch: true,
            custodyEvents: 10,
            custodyGaps: false,
            conditionRating: 'A',
            marketVolume: 500, // Very low volume -> Lender should FAIL
            tamperEvents: 0,
            geoMismatch: false,
            conditionReportDate: new Date()
        } as AssetInputs
    },
    {
        id: 'marketplace_risky',
        label: 'Marketplace Risky',
        desc: 'Minor Risk signals (Fraud 0.35)',
        inputs: {
            opticalMatch: 0.85, // Lower optical
            serialMatch: true,
            custodyEvents: 5,
            custodyGaps: false,
            conditionRating: 'B',
            marketVolume: 50000,
            tamperEvents: 0,
            geoMismatch: false,
            conditionReportDate: new Date()
        } as AssetInputs
    }
];

export function PolicyCompare() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Record<string, DecisionResponse> | null>(null);
    const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[1].id); // Default to Stale

    const runSimulation = async (inputs: AssetInputs) => {
        setLoading(true);
        try {
            const res = await fetch('/api/core/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId: 'SIM-COMPARE-001',
                    inputs: inputs
                })
            });
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (e) {
            console.error("Simulation error", e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-run when selection changes
    useEffect(() => {
        const scenario = SCENARIOS.find(s => s.id === selectedScenarioId);
        if (scenario) runSimulation(scenario.inputs);
    }, [selectedScenarioId]);

    const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId);

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-6 mt-12 mb-20">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        Policy Differentiation Matrix
                        <span className="text-[10px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded-full">v2.1 SIMULATOR</span>
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xl">
                        Universal Truth, Segmented Trust. See how the same asset state resolves to different decisions based on risk appetite.
                    </p>
                </div>

                {/* Scenario Selector */}
                <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {SCENARIOS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedScenarioId(s.id)}
                            disabled={loading}
                            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded transition-colors ${selectedScenarioId === s.id
                                    ? 'bg-sky-600 text-white shadow-lg'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Active Scenario Details */}
            {activeScenario && (
                <div className="flex items-center gap-4 mb-8 text-[10px] font-mono text-slate-400 bg-slate-950/50 p-3 rounded border border-slate-800/50">
                    <span className="text-sky-500 font-bold uppercase">{activeScenario.desc}</span>
                    <div className="h-3 w-px bg-slate-800"></div>
                    <span>COND: {activeScenario.inputs.conditionRating}</span>
                    <span>VOL: {activeScenario.inputs.marketVolume}</span>
                </div>
            )}

            {results && !loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PolicyCard
                        label="Insurer (Conservative)"
                        data={results['insurer']}
                        description="Zero tolerance for ambiguity. Fast decay."
                    />
                    <PolicyCard
                        label="Lender (Capital)"
                        data={results['lender']}
                        description="Focus on liquidity and custody chain."
                    />
                    <PolicyCard
                        label="Marketplace (Velocity)"
                        data={results['marketplace']}
                        description="Disclosure-first. Long expiration."
                    />
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-slate-600 text-sm animate-pulse">
                    Computing Policy Gates...
                </div>
            )}
        </div>
    );
}

function PolicyCard({ label, data, description }: { label: string, data: DecisionResponse, description: string }) {
    if (!data) return <div className="animate-pulse bg-slate-800 h-64 rounded"></div>;

    const isRejected = data.decision === 'REJECTED' || data.decision === 'REVOKED';
    const isReview = data.decision === 'REVIEW_REQUIRED' || data.decision === 'EXPIRED';

    // Status Colors
    let statusColor = 'text-emerald-500';
    let borderColor = 'border-emerald-900/50';
    let bgGradient = 'from-emerald-950/20 to-transparent';

    if (isRejected) {
        statusColor = 'text-red-500';
        borderColor = 'border-red-900/50';
        bgGradient = 'from-red-950/20 to-transparent';
    } else if (isReview) {
        statusColor = 'text-amber-500';
        borderColor = 'border-amber-900/50';
        bgGradient = 'from-amber-950/20 to-transparent';
    } else if (data.decision === 'VERIFIED_WITH_DISCLOSURE') {
        statusColor = 'text-sky-500';
        borderColor = 'border-sky-900/50';
        bgGradient = 'from-sky-950/20 to-transparent';
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`border ${borderColor} bg-gradient-to-b ${bgGradient} rounded-lg p-5 flex flex-col h-full shadow-xl shadow-black/20`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-sm font-bold text-slate-200">{label}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{description}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-600">v{data.audit.policy_version}</div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 border-y border-slate-800/50 bg-slate-950/30 rounded mb-4">
                <span className={`text-xl font-bold ${statusColor} text-center`}>
                    {data.decision.replace(/_/g, " ")}
                </span>
                <span className="text-[9px] text-slate-500 uppercase mt-1 tracking-wider">
                    {data.confidence_band} CONFIDENCE
                </span>
            </div>

            {/* Why? */}
            <div className="flex-1 space-y-3">
                {data.required_actions.length > 0 ? (
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Blocking Factors</span>
                        {data.required_actions.map((act, i) => (
                            <div key={i} className="text-xs text-slate-300 bg-black/20 p-2 rounded border border-slate-800 flex items-start gap-2">
                                <div className="mt-0.5 w-1 h-1 bg-red-500 rounded-full shrink-0"></div>
                                <div>
                                    <span className="font-bold text-slate-400 block text-[9px] mb-0.5">{act.label}</span>
                                    {act.reason}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-emerald-500/60 italic text-center mt-4">
                        Passed all {label.split(' ')[0]} gates.
                    </div>
                )}
            </div>

            {/* Matrix Stats */}
            <div className="mt-4 pt-3 border-t border-slate-800/50 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                <div className="flex justify-between group cursor-help" title="Identity Score">
                    <span>ID:</span>
                    <span className={data.scores.identity < 0.8 ? 'text-white font-bold' : 'text-slate-400'}>{(data.scores.identity * 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between group cursor-help" title="Liquidity Score">
                    <span>LIQ:</span>
                    <span className={data.scores.liquidity < 0.6 ? 'text-white font-bold' : 'text-slate-400'}>{(data.scores.liquidity * 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between group cursor-help" title="Condition Score">
                    <span>CND:</span>
                    <span className={data.scores.condition < 0.6 ? 'text-white font-bold' : 'text-slate-400'}>{(data.scores.condition * 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between group cursor-help" title="Fraud Risk">
                    <span>FRD:</span>
                    <span className={data.scores.fraud_risk > 0.1 ? 'text-red-400 font-bold' : 'text-slate-400'}>{(data.scores.fraud_risk * 100).toFixed(0)}</span>
                </div>
            </div>

        </motion.div>
    );
}
