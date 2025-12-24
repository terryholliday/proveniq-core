"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INVESTOR_DEMO_SCRIPT, ScriptStep } from './InvestorScript';

export function DemoOverlay() {
    // Only mount if query param ?demo=true or local storage is set.
    // For the easter egg, we will use a global event or context, 
    // but for simplicity in this overlay, we'll assume it's controlled by Layout state passed down,
    // OR it self-subscribes to a "demo-mode" event.
    // Let's rely on the parent (Layout/Footer) to conditionally render this component.

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);

    const step = INVESTOR_DEMO_SCRIPT[currentStepIndex];
    const totalSteps = INVESTOR_DEMO_SCRIPT.length;

    const nextStep = () => {
        if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999] font-sans">
            <AnimatePresence>
                {isExpanded ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-black/90 backdrop-blur-md border border-amber-500/50 rounded-xl shadow-2xl w-[380px] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-amber-950/30 p-3 border-b border-amber-900/30 flex justify-between items-center cursor-move">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                    Investor Mode • {step.timeRange}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white text-xs">_</button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-1 leading-tight">{step.section}</h3>
                                <div className="text-xs font-mono text-cyan-400 bg-cyan-950/30 p-1.5 rounded inline-block">
                                    👉 {step.action}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {step.script.map((line, i) => (
                                    <p key={i} className="text-sm text-slate-300 leading-relaxed">
                                        {line}
                                    </p>
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStepIndex === 0}
                                    className="text-xs text-slate-500 hover:text-white disabled:opacity-30"
                                >
                                    ← PREV
                                </button>
                                <span className="text-[10px] text-slate-600 font-mono">
                                    {currentStepIndex + 1} / {totalSteps}
                                </span>
                                <button
                                    onClick={nextStep}
                                    disabled={currentStepIndex === totalSteps - 1}
                                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold rounded"
                                >
                                    {currentStepIndex === totalSteps - 1 ? 'FINISH' : 'NEXT →'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        layoutId="minimized"
                        onClick={() => setIsExpanded(true)}
                        className="bg-amber-600 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:bg-amber-500 transition-colors"
                    >
                        Script ({currentStepIndex + 1}/{totalSteps})
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
