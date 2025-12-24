"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";

interface EvidenceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    factorTitle: string;
    evidenceRefs: string[];
}

export function EvidenceDrawer({ isOpen, onClose, factorTitle, evidenceRefs }: EvidenceDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="absolute top-0 right-0 h-full w-full md:w-80 bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h3 className="font-bold text-sm text-white">Evidence Chain</h3>
                            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            <div className="mb-6">
                                <span className="text-[10px] uppercase text-slate-500 font-mono">Driving Factor</span>
                                <h4 className="text-emerald-500 font-mono text-sm mt-1">{factorTitle}</h4>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[10px] uppercase text-slate-500 font-mono block">Linked Artifacts</span>
                                {evidenceRefs.length === 0 ? (
                                    <div className="text-xs text-slate-500 italic">No direct evidence linked to this factor.</div>
                                ) : (
                                    evidenceRefs.map((ref, i) => (
                                        <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded group hover:border-sky-500/50 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                                <span className="text-xs font-mono text-sky-400 break-all">{ref}</span>
                                            </div>

                                            {/* Simulated Content Preview */}
                                            {ref.includes("img") && (
                                                <div className="w-full h-24 bg-slate-900 rounded flex items-center justify-center border border-slate-800 border-dashed">
                                                    <span className="text-[10px] text-slate-600">IMAGE_PREVIEW_UNAVAILABLE</span>
                                                </div>
                                            )}
                                            {ref.includes("evt") && (
                                                <div className="text-[10px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                                                    Event Signature Verified
                                                    <br />
                                                    TS: {new Date().toISOString()}
                                                </div>
                                            )}
                                            {ref.includes("doc") && (
                                                <div className="flex items-center gap-2 text-xs text-slate-300">
                                                    <span className="text-xl">📄</span> Document PDF
                                                </div>
                                            )}

                                            <div className="mt-2 flex justify-end">
                                                <button className="text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-wider">
                                                    Verify Hash &rarr;
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
