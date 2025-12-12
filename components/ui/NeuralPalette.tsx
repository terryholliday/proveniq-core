"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import Link from 'next/link';
import { Search } from 'lucide-react';
import { FlightPath } from "@/components/intents/FlightPath";

const Z_INDEX = {
    modal: 100,
};

export function NeuralPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<typeof PROVENIQ_DNA.products>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [intentMode, setIntentMode] = useState<string | null>(null);

    // Open/Close logic
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (intentMode) {
                    setIntentMode(null);
                    setQuery("");
                } else {
                    setOpen((open) => !open);
                }
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [intentMode]);

    // Search & Intent Logic
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const hits = PROVENIQ_DNA.products.filter(p =>
            p.label.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase())
        );
        setResults(hits);
    }, [query]);

    const executeParams = (product: typeof PROVENIQ_DNA.products[0]) => {
        setOpen(false);
        // In real app, router.push via code
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !intentMode) {
            const lowerQ = query.toLowerCase();
            // 1. Check for Intent Keywords
            if (lowerQ.startsWith("bridge") || lowerQ.startsWith("swap") || lowerQ.startsWith("buy")) {
                e.preventDefault();
                setIntentMode(query);
            }
            // 2. Or execute selected navigation result
            else if (results[selectedIndex]) {
                e.preventDefault();
                // This would be navigation in real life
                // router.push(...)
            }
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.1 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {intentMode ? (
                            <div className="p-4 bg-slate-950 min-h-[300px]">
                                <FlightPath
                                    intent={intentMode}
                                    onComplete={() => { }}
                                />
                                <button
                                    onClick={() => { setIntentMode(null); setQuery(""); }}
                                    className="mt-4 text-xs text-slate-500 hover:text-white underline"
                                >
                                    Reset / New Command
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center px-4 py-3 border-b border-slate-800">
                                    <Search className="text-slate-500 mr-3" size={20} />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a command or search..."
                                        className="bg-transparent border-none outline-none text-white placeholder-slate-500 w-full font-mono text-sm"
                                    />
                                    <div className="hidden sm:flex gap-1">
                                        <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-800 rounded border border-slate-700">ESC</kbd>
                                    </div>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto p-2">
                                    {results.length === 0 && query && (
                                        <div className="p-4 text-center text-slate-500 text-xs font-mono">
                                            {query.toLowerCase().startsWith("bridge") || query.toLowerCase().startsWith("swap") || query.toLowerCase().startsWith("buy") ?
                                                <span className="text-emerald-500 animate-pulse">PRESS ENTER TO EXECUTE INTENT &gt;&gt;</span> :
                                                "NO_MATCHING_DNA_SEQUENCE"
                                            }
                                        </div>
                                    )}

                                    {results.map((product, index) => (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.routeSlug}`}
                                            onClick={() => setOpen(false)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`flex items-center px-3 py-2 rounded-lg transition-colors group ${index === selectedIndex ? 'bg-slate-800' : ''}`}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-sky-500 mr-3 transition-colors" />
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-sky-400">{product.label}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{product.role}</div>
                                            </div>
                                            <span className="text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 uppercase">
                                                Jump To
                                            </span>
                                        </Link>
                                    ))}

                                    {!query && (
                                        <div className="p-2">
                                            <div className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest pl-2">Suggested Intents</div>
                                            <button onClick={() => { setQuery("Bridge 5M USDC to Base"); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded font-mono transition-colors">
                                                Bridge 5M USDC to Base...
                                            </button>
                                            <button onClick={() => { setQuery("Swap ETH for mTBILL optimized"); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded font-mono transition-colors">
                                                Swap ETH for mTBILL optimized...
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <div>
                                PROVENIQ<span className="text-sky-500">_NEURAL</span> v2.1
                            </div>
                            <div>
                                {intentMode ? "SOLVER_NETWORK_ACTIVE" : "INTENT_ENGINE_READY"}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
