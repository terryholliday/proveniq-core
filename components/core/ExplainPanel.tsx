"use client";

import React, { useState } from 'react';
import { DecisionResponse, FactorContribution } from '@/lib/core/types';
import { LEDGER } from '@/lib/core/ledger';
import { motion, AnimatePresence } from 'framer-motion';
import { PROVENIQ_DNA } from '@/lib/config';
import { EvidenceDrawer } from './EvidenceDrawer';

interface ExplainPanelProps {
    analysis: DecisionResponse;
}

export function ExplainPanel({ analysis }: ExplainPanelProps) {
    const history = LEDGER.getAssetHistory(analysis.asset_id);
    const [view, setView] = useState<'SCORE' | 'LEDGER'>('SCORE');

    // Evidence Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedFactor, setSelectedFactor] = useState<{ title: string, refs: string[] } | null>(null);

    const handleFactorClick = (factor: FactorContribution) => {
        if (factor.evidence_refs && factor.evidence_refs.length > 0) {
            setSelectedFactor({ title: factor.title, refs: factor.evidence_refs });
            setDrawerOpen(true);
        }
    };

    // Color mapping
    const riskColor =
        analysis.decision === 'REJECTED' ? 'text-red-500' :
            analysis.decision === 'REVIEW_REQUIRED' ? 'text-amber-500' :
                'text-emerald-500';

    const riskBg =
        analysis.decision === 'REJECTED' ? 'bg-red-500' :
            analysis.decision === 'REVIEW_REQUIRED' ? 'bg-amber-500' :
                'bg-emerald-500';

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[600px] relative">

            <EvidenceDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                factorTitle={selectedFactor?.title || ''}
                evidenceRefs={selectedFactor?.refs || []}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('SCORE')}
                        className={`text-xs font-mono px-3 py-1 rounded transition-colors ${view === 'SCORE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        DECISION_MATRIX
                    </button>
                    <button
                        onClick={() => setView('LEDGER')}
                        className={`text-xs font-mono px-3 py-1 rounded transition-colors ${view === 'LEDGER' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        EVENT_LEDGER
                    </button>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-opacity-20 ${riskBg} ${riskColor}`}>
                    {analysis.decision} :: {analysis.confidence_band}_CONFIDENCE
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence mode='wait'>
                    {view === 'SCORE' && (
                        <motion.div
                            key="score"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-6"
                        >
                            {/* Top Score */}
                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                                        <circle
                                            cx="48" cy="48" r="40"
                                            stroke="currentColor" strokeWidth="6" fill="transparent"
                                            className={riskColor}
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * (analysis.scores.core_confidence * 100)) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-bold text-white">{(analysis.scores.core_confidence * 100).toFixed(0)}</span>
                                        <span className="text-[9px] text-slate-500 uppercase">Confidence</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm text-slate-400 font-mono mb-1">POLICY DETERMINISTIC</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                                        Evaluated against <span className="text-sky-500">{analysis.policy_id}</span>.
                                        Score driven by {analysis.top_factors.length} weighted factors.
                                    </p>
                                </div>
                            </div>

                            {/* Factor Breakdown (Buckets) */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-mono text-slate-500 uppercase">Component Scores</h4>
                                <FactorRow label="Identity Assurance" score={analysis.scores.identity * 100} />
                                <FactorRow label="Provenance Chain" score={analysis.scores.provenance * 100} />
                                <FactorRow label="Physical Condition" score={analysis.scores.condition * 100} />
                                <FactorRow label="Liquidity Depth" score={analysis.scores.liquidity * 100} />
                                <FactorRow label="Fraud Safety" score={(1 - analysis.scores.fraud_risk) * 100} />
                            </div>

                            {/* Top Factors (Why?) */}
                            <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800">
                                <h4 className="text-[10px] font-mono text-slate-500 uppercase mb-3">Explainability Contract</h4>
                                <ul className="space-y-2">
                                    {analysis.top_factors.map((factor, i) => (
                                        <li key={i} className="text-xs font-mono flex flex-col border-b border-slate-900 pb-2 last:border-0 group">
                                            <div className="flex items-start justify-between cursor-pointer" onClick={() => handleFactorClick(factor)}>
                                                <div className="flex flex-col group-hover:text-white transition-colors">
                                                    <span className="text-slate-300">{factor.title}</span>
                                                    <span className="text-[9px] text-slate-600">{factor.factor_id}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`${factor.contribution < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {factor.contribution > 0 ? '+' : ''}{factor.contribution.toFixed(2)}
                                                    </span>
                                                    <span className="text-[9px] text-slate-600">Impact</span>
                                                </div>
                                            </div>

                                            {/* Drill Down Indicator */}
                                            {factor.evidence_refs && factor.evidence_refs.length > 0 && (
                                                <div className="mt-1 flex gap-1">
                                                    <div
                                                        className="text-[9px] bg-slate-900 text-sky-500 px-1.5 py-0.5 rounded cursor-pointer hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                                                        onClick={(e) => { e.stopPropagation(); handleFactorClick(factor); }}
                                                    >
                                                        <span>{factor.evidence_refs.length} Artifacts</span>
                                                        <span className="text-[8px]">&rarr;</span>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Required Actions */}
                            {analysis.required_actions.length > 0 && (
                                <div className="mt-4 p-3 bg-red-950/20 rounded border border-red-900/50">
                                    <h4 className="text-[10px] font-mono text-red-400 uppercase mb-2">Required Actions</h4>
                                    <ul className="list-disc list-inside text-xs text-red-300/80">
                                        {analysis.required_actions.map((action, i) => (
                                            <li key={i}><span className="font-bold">{action.label}:</span> {action.reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </motion.div>
                    )}

                    {view === 'LEDGER' && (
                        <motion.div
                            key="ledger"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="relative border-l border-slate-800 ml-3 space-y-6 py-2"
                        >
                            {history.length === 0 && (
                                <div className="text-xs text-slate-500 italic pl-4">No events found in local memory ledger.</div>
                            )}
                            {history.map((event) => (
                                <div key={event.event_id} className="relative pl-6 group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${event.type === 'DECISION_REVOKED' ? 'bg-red-500' :
                                            event.type === 'DECISION_RECORDED' ? 'bg-emerald-500' :
                                                'bg-slate-500'
                                        }`} />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-baseline justify-between">
                                            <span className={`text-xs font-bold font-mono ${event.type === 'DECISION_REVOKED' ? 'text-red-400' : 'text-slate-200'
                                                }`}>
                                                {event.type}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-mono">{new Date(event.occurred_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                            <span>Actor: <span className="text-slate-300">{event.actor.id}</span></span>
                                            <span title={event.payload_hash}>#{event.payload_hash.substring(0, 8)}...</span>
                                        </div>
                                        {event.prev_event_id && (
                                            <div className="text-[9px] text-slate-700 font-mono">
                                                Prev: {event.prev_event_id.substring(0, 12)}...
                                            </div>
                                        )}

                                        {/* Replay Button (Stub) */}
                                        {event.type === 'DECISION_RECORDED' && (
                                            <button className="hidden group-hover:block text-[9px] text-sky-500 text-left hover:underline mt-1">
                                                [REPLAY STATE]
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </ AnimatePresence>
            </div>

            {/* Footer Audit */}
            <div className="p-2 border-t border-slate-800 bg-slate-950 flex flex-wrap justify-between text-[9px] font-mono text-slate-600 gap-2">
                <span>V:{analysis.audit.score_model_version}</span>
                <span>TS:{new Date(analysis.audit.computed_at).toLocaleDateString()}</span>
                {analysis.audit.ledger_event_id && (
                    <span className="text-emerald-900">LEDGER_ID:{analysis.audit.ledger_event_id.substring(0, 10)}...</span>
                )}
            </div>
        </div>
    );
}

function FactorRow({ label, score }: { label: string, score: number }) {
    // Score expected 0-100
    const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className={`font-mono ${textColor}`}>
                    {score.toFixed(0)}/100
                </span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: PROVENIQ_DNA.theme.motion.easeHeavy }}
                    className={`h-full ${barColor}`}
                />
            </div>
        </div>
    )
}
