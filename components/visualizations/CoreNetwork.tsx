"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import { TIMING } from "@/lib/physics";

type CoreState = "IDLE" | "HANDSHAKE" | "SYNC" | "ACTIVE";

const STATE_CONFIG: Record<CoreState, { color: string; label: string }> = {
    IDLE: { color: "bg-slate-500", label: "System Standby" },
    HANDSHAKE: { color: "bg-amber-500", label: "Handshake Protocol" },
    SYNC: { color: "bg-sky-500", label: "Synchronizing Ledger" },
    ACTIVE: { color: "bg-emerald-500", label: "Orchestration Active" },
};

export function CoreNetwork() {
    const [state, setState] = useState<CoreState>("IDLE");
    const shouldReduceMotion = useReducedMotion();

    // Explicit State Machine Logic
    useEffect(() => {
        // Only cycle states if motion is allowed, otherwise stay static active or idle
        // However, logic might still run even if motion is reduced, just visual flow stops.
        // Let's cycle states to show the label changing, but stop the "packets" below.

        const cycle: CoreState[] = ["IDLE", "HANDSHAKE", "SYNC", "ACTIVE", "ACTIVE", "ACTIVE", "IDLE"];
        let index = 0;

        const interval = setInterval(() => {
            index = (index + 1) % cycle.length;
            setState(cycle[index]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const currentState = STATE_CONFIG[state];

    // Packet animation variants
    const packetVariants = {
        animate: {
            x: [0, 200],
            opacity: [0, 1, 0]
        },
        static: {
            x: 0,
            opacity: 0, // No flow in reduced motion
        }
    };

    return (
        <div className="p-8 border rounded-xl border-slate-800 bg-slate-900/50 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Core Network Status</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentState.color} shadow-[0_0_10px_currentColor]`} />
                    <span className="text-sm font-mono text-slate-300">{currentState.label}</span>
                </div>
            </div>

            <div className="relative h-64 border border-slate-800 rounded-lg bg-slate-950 flex items-center justify-around overflow-hidden">

                {/* Nodes */}
                {["Ingest", "Verify", "Orchestrate"].map((node, i) => (
                    <div key={node} className="z-10 flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${state === 'ACTIVE' ? 'bg-sky-500' : 'bg-slate-600'}`} />
                        </div>
                        <span className="text-xs text-slate-500 font-mono uppercase">{node}</span>
                    </div>
                ))}

                {/* Connection Lines & Packets */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Left to Middle */}
                    <div className="relative w-1/3 h-px bg-slate-800">
                        {state === 'ACTIVE' && (
                            <motion.div
                                className="absolute top-1/2 left-0 w-8 h-1 -mt-0.5 bg-sky-500 rounded-full blur-[1px]"
                                variants={packetVariants}
                                animate={shouldReduceMotion ? "static" : "animate"}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                    </div>
                    {/* Middle to Right */}
                    <div className="relative w-1/3 h-px bg-slate-800">
                        {state === 'ACTIVE' && (
                            <motion.div
                                className="absolute top-1/2 left-0 w-8 h-1 -mt-0.5 bg-emerald-500 rounded-full blur-[1px]"
                                variants={packetVariants}
                                animate={shouldReduceMotion ? "static" : "animate"}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.5 }}
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
