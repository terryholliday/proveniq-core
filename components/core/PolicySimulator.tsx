"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AssetInputs, DecisionResponse } from '@/lib/core/types';
import { CORE_POLICIES } from '@/lib/core/policies';
import { evaluateAsset } from '@/lib/core/decision';

export function PolicySimulator() {
    // 1. Fixed Input Set for Simulation
    const inputs: AssetInputs = {
        opticalMatch: 0.98,
        serialMatch: true,
        custodyEvents: 8,
        custodyGaps: false,
        conditionRating: 'A', // Good condition
        marketVolume: 8000,   // Low-ish Volume (Should hurt Lender)
        tamperEvents: 0,
        geoMismatch: false
    };

    // 2. Pre-calculate outcomes
    const outcomes = [
        { label: 'Carrier (Insurer)', policy: CORE_POLICIES['insurer'], result: evaluateAsset('SIM-01', inputs, CORE_POLICIES['insurer']) },
        { label: 'Lender (Capital)', policy: CORE_POLICIES['lender'], result: evaluateAsset('SIM-01', inputs, CORE_POLICIES['lender']) },
        { label: 'Market (Velocity)', policy: CORE_POLICIES['marketplace'], result: evaluateAsset('SIM-01', inputs, CORE_POLICIES['marketplace']) }
    ];

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-6 mt-12">
            <header className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Policy Differentiation (Pricing Power)</h3>
                <p className="text-sm text-slate-400">
                    Same Asset ({inputs.conditionRating} Grade, {inputs.marketVolume} Vol) → Divergent Outcomes based on Risk Appetite.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {outcomes.map((item, i) => (
                    <SimulatorCard
                        key={i}
                        label={item.label}
                        result={item.result}
                        index={i}
                    />
                ))}
            </div>
        </div>
    );
}

function SimulatorCard({ label, result, index }: { label: string, result: DecisionResponse, index: number }) {
    const isRejected = result.decision === 'REJECTED';
    const isReview = result.decision === 'REVIEW_REQUIRED';

    // Visual Styles
    const borderColor = isRejected ? 'border-red-900/50' : isReview ? 'border-amber-900/50' : 'border-emerald-900/50';
    const bgColor = isRejected ? 'bg-red-950/10' : isReview ? 'bg-amber-950/10' : 'bg-emerald-950/10';
    const textColor = isRejected ? 'text-red-500' : isReview ? 'text-amber-500' : 'text-emerald-500';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border ${borderColor} ${bgColor} rounded p-4 flex flex-col gap-4`}
        >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{label}</span>
                <span className="text-[10px] text-slate-600 font-mono">v{result.audit.policy_version}</span>
            </div>

            <div className="flex flex-col items-center py-2">
                <span className={`text-xl font-bold ${textColor}`}>{result.decision}</span>
                <span className="text-[10px] text-slate-500 uppercase mt-1">{result.confidence_band} Confidence</span>
            </div>

            {/* Factor Highlights (Why?) */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Identity:</span>
                    <span className={result.scores.identity < 0.7 ? 'text-red-400' : 'text-slate-200'}>
                        {(result.scores.identity * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Liquidity:</span>
                    <span className={result.scores.liquidity < 0.6 ? 'text-red-400' : 'text-slate-200'}>
                        {(result.scores.liquidity * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Fraud Risk:</span>
                    <span className={result.scores.fraud_risk > 0.3 ? 'text-red-400' : 'text-slate-200'}>
                        {(result.scores.fraud_risk * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Key Reason */}
            {result.required_actions.length > 0 ? (
                <div className="bg-slate-950/50 p-2 rounded text-[10px] text-slate-400 italic">
                    "{result.required_actions[0].reason}"
                </div>
            ) : (
                <div className="bg-slate-950/50 p-2 rounded text-[10px] text-emerald-400/70 italic">
                    "Meets all risk thresholds."
                </div>
            )}
        </motion.div>
    );
}
