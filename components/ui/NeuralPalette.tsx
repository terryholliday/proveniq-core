"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import { LAYOUT, Z_INDEX } from "@/lib/physics";

/**
 * NeuralPalette
 * 
 * "Power User" Command Interface.
 * - Trigger: Cmd+K / Ctrl+K
 * - Scope: Global DNA Navigation
 */

export function NeuralPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // 1. Keyboard Listeners
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // 2. Data Filtering (Flattening DNA)
    const results = useMemo(() => {
        if (!query) return PROVENIQ_DNA.products;

        const lowerQuery = query.toLowerCase();
        return PROVENIQ_DNA.products.filter(p =>
            p.label.toLowerCase().includes(lowerQuery) ||
            p.role.toLowerCase().includes(lowerQuery) ||
            p.type.toLowerCase().includes(lowerQuery)
        );
    }, [query]);

    // 3. Navigation Logic
    const executeParams = (product: typeof PROVENIQ_DNA.products[number]) => {
        setOpen(false);
        setQuery("");

        if (product.type === "Software") {
            router.push(`/products/${product.routeSlug}`);
        } else if (product.type === "Hardware") {
            router.push(`/hardware/${product.routeSlug}`);
        } else {
            // Fallback
            router.push("/");
        }
    };

    // Keyboard navigation within list
    useEffect(() => {
        const handleNav = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % results.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (results[selectedIndex]) {
                    executeParams(results[selectedIndex]);
                }
            }
        }

        window.addEventListener("keydown", handleNav);
        return () => window.removeEventListener("keydown", handleNav);
    }, [open, selectedIndex, results]);

    // Reset selection on query change
    useEffect(() => setSelectedIndex(0), [query]);


    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
                    style={{ zIndex: Z_INDEX.modal }}
                    onClick={() => setOpen(false)}
                >
                    {/* Palette Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-3 border-b border-slate-800">
                            <svg className="w-5 h-5 text-slate-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:outline-none text-lg"
                                placeholder="Access neural interface..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono text-slate-500 bg-slate-800 rounded">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    No modules found matching signal.
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {results.map((item, index) => (
                                        <li
                                            key={item.id}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? "bg-sky-500/10 text-sky-400" : "text-slate-300 hover:bg-slate-800"
                                                }`}
                                            onClick={() => executeParams(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{item.label}</span>
                                                <span className="text-[10px] opacity-70 uppercase tracking-wider">{item.role}</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded text-[10px] border border-current opacity-50">
                                                {item.type}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                            <span>PROVENIQ NEURAL NET</span>
                            <span>{results.length} NODES CONNECTED</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
