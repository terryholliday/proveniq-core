"use client";

import { Command } from 'cmdk';
import { useState, useEffect } from 'react';
import { parseIntent, IntentObject } from '@/lib/intents/parser';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, ShieldCheck, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PROVENIQ_DNA } from '@/lib/config';

export const NeuralConsole = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [intent, setIntent] = useState<IntentObject | null>(null);
    const router = useRouter();

    // Toggle Logic (Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Use CMDK's built-in filtering if no intent
    // Real-time parsing loop
    useEffect(() => {
        const result = parseIntent(input);
        setIntent(result);
    }, [input]);

    const handleSelect = (value: string) => {
        setOpen(false);
        router.push(value);
    }

    if (!open) return null;

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Neural Console"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100]"
        >
            <div className="flex items-center border-b border-slate-800 px-4 py-3">
                {intent ? (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-3 shadow-[0_0_10px_#10b981]" />
                ) : (
                    <div className="w-2 h-2 bg-slate-500 rounded-full mr-3" />
                )}
                <Command.Input
                    className="flex-1 bg-transparent text-lg font-mono text-white placeholder:text-slate-600 outline-none"
                    placeholder="Type a command (e.g. 'Buy 100k TBILL')..."
                    value={input}
                    onValueChange={setInput}
                />
                {intent && (
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        CONFIDENCE: {(intent.confidence * 100)}%
                    </span>
                )}
            </div>

            <div className="min-h-[100px] bg-slate-900/50">
                <AnimatePresence mode='wait'>

                    {/* STATE 1: INTENT RECOGNIZED */}
                    {intent ? (
                        <motion.div
                            key="intent-view"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-4"
                        >
                            <div className="flex justify-between items-start mb-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
                                <div>
                                    <h3 className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Proposed Execution</h3>
                                    <div className="text-xl text-white font-bold flex items-center gap-2 mt-1 font-mono">
                                        <span className="text-emerald-400">{intent.type}</span>
                                        <span>{intent.amount ? intent.amount.toLocaleString() : '---'} {intent.asset}</span>
                                        {intent.targetChain && (
                                            <>
                                                <ArrowRight className="w-4 h-4 text-slate-600" />
                                                <span className="text-sky-400">{intent.targetChain}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* The "Flight Path" Visualization */}
                            <div className="space-y-1 mb-4">
                                <Step label="Route Optimization (CowSwap)" status="complete" />
                                <Step label="Slippage Protection (<0.1%)" status="complete" />
                                <Step label="MEV Guard (Flashbots)" status="active" />
                                <Step label="Compliance Check (ZK-Passport)" status="pending" />
                            </div>

                            <div className="flex gap-2 font-mono text-xs">
                                <button
                                    onClick={() => {
                                        alert("EXECUTING: " + JSON.stringify(intent));
                                        setOpen(false);
                                    }}
                                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-2 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <Activity size={14} /> EXECUTE INTENT
                                </button>
                                <button
                                    onClick={() => setInput('')}
                                    className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        /* STATE 2: DEFAULT NAVIGATION */
                        <motion.div
                            key="nav-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-h-[300px] overflow-y-auto"
                        >
                            <Command.List className="p-2">
                                <Command.Empty className="p-4 text-center text-slate-500 text-xs font-mono">No modules found.</Command.Empty>

                                {PROVENIQ_DNA.products.map((product) => (
                                    <Command.Item
                                        key={product.id}
                                        value={product.label}
                                        onSelect={() => handleSelect(`/products/${product.routeSlug}`)}
                                        className="flex items-center px-3 py-2 rounded-lg cursor-pointer text-slate-300 aria-selected:bg-slate-800 aria-selected:text-white transition-colors"
                                    >
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mr-3",
                                            product.type === "Software" ? "bg-sky-500" : "bg-amber-500"
                                        )} />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">{product.label}</div>
                                            <div className="text-[10px] text-slate-500 font-mono uppercase">{product.role} // {product.type}</div>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono opacity-50">JUMP TO</span>
                                    </Command.Item>
                                ))}
                            </Command.List>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <div>
                    PROVENIQ<span className="text-emerald-500">_SOLVER</span> NETWORK
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    SECURE_ENCLAVE
                </div>
            </div>

        </Command.Dialog>
    );
};

function Step({ label, status }: { label: string; status: 'complete' | 'active' | 'pending' }) {
    return (
        <div className="flex items-center gap-3 px-2 py-1">
            <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center border",
                status === 'complete' ? "bg-emerald-500 border-emerald-500 text-black" :
                    status === 'active' ? "border-sky-500 text-sky-500 animate-pulse" :
                        "border-slate-700 text-slate-700"
            )}>
                {status === 'complete' && <Check size={10} strokeWidth={4} />}
                {status === 'active' && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />}
            </div>
            <span className={cn(
                "text-xs font-mono",
                status === 'complete' ? "text-emerald-500" :
                    status === 'active' ? "text-sky-400" :
                        "text-slate-600"
            )}>
                {label}
            </span>
        </div>
    )
}
