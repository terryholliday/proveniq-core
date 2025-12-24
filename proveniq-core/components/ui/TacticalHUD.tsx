"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Z_INDEX } from "@/lib/physics";

export function TacticalHUD() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
                setOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-8 backdrop-blur-sm"
                    style={{ zIndex: Z_INDEX.modal + 10 }}
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                        <div className="relative z-10">
                            <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">TACTICAL GUIDANCE</h2>
                                    <p className="text-sm text-slate-400 font-mono">SYSTEM_KEYBINDINGS_V3.2</p>
                                </div>
                                <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-500 border border-slate-700">
                                    ?
                                </div>
                            </header>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <Section title="NAVIGATION">
                                    <Shortcut keys={["Cmd", "K"]} label="Neural Palette (Search)" />
                                    <Shortcut keys={["Esc"]} label="Close / Cancel" />
                                </Section>

                                <Section title="SYSTEM">
                                    <Shortcut keys={["?"]} label="Toggle HUD" />
                                    <Shortcut keys={["Click"]} label="Audio Synthesis" />
                                </Section>
                            </div>

                            <footer className="mt-12 pt-4 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between">
                                <span>PROVENIQ KERNEL</span>
                                <span>OPERATIONAL</span>
                            </footer>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-sky-500 mb-4 tracking-wider uppercase">{title}</h3>
            <ul className="space-y-3">
                {children}
            </ul>
        </div>
    );
}

function Shortcut({ keys, label }: { keys: string[], label: string }) {
    return (
        <li className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{label}</span>
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-400 min-w-[24px] text-center">
                        {k}
                    </kbd>
                ))}
            </div>
        </li>
    );
}
