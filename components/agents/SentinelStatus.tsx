"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, AlertTriangle, Zap, Terminal, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentState = "IDLE" | "ANALYZING" | "SIMULATING" | "SIGNING" | "EXECUTING" | "COOLDOWN";

interface LogEntry {
    id: string;
    timestamp: string;
    level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS";
    message: string;
}

export function SentinelStatus() {
    const [state, setState] = useState<AgentState>("IDLE");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Simulation Loop
    useEffect(() => {
        const sequence: { state: AgentState; duration: number; log?: string }[] = [
            { state: "IDLE", duration: 2000 },
            { state: "ANALYZING", duration: 1500, log: "Scanning Treasury Yields across 14 pools..." },
            { state: "ANALYZING", duration: 1500, log: "Volatility Index (VIX) check: 12.4 [ACCEPTABLE]" },
            { state: "SIMULATING", duration: 2000, log: "Simulating swap route via 1inch aggregation..." },
            { state: "SIMULATING", duration: 1000, log: "Projected slippage: 0.04% [OPTIMAL]" },
            { state: "SIGNING", duration: 1500, log: "Requesting Lit Protocol PKP signature..." },
            { state: "EXECUTING", duration: 2500, log: "Broadcasting TX: 0x8a...3f9c to Arbitrum One" },
            { state: "COOLDOWN", duration: 3000, log: "Execution Confirmed. Entering sleep cycle." },
        ];

        let currentIndex = 0;

        const runStep = () => {
            const step = sequence[currentIndex];
            setState(step.state);

            if (step.log) {
                addLog(step.log, step.state === "EXECUTING" ? "SUCCESS" : step.state === "SIGNING" ? "CRITICAL" : "INFO");
            }

            currentIndex = (currentIndex + 1) % sequence.length;
            setTimeout(runStep, step.duration);
        };

        const timeout = setTimeout(runStep, 1000);
        return () => clearTimeout(timeout);
    }, []);

    const addLog = (message: string, level: LogEntry["level"]) => {
        setLogs((prev) => [
            ...prev.slice(-9), // Keep last 10
            {
                id: Math.random().toString(36),
                timestamp: new Date().toISOString().split("T")[1].slice(0, 8),
                level,
                message,
            },
        ]);
    };

    // Scroll to bottom
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={cn("w-3 h-3 rounded-full animate-pulse",
                            state === "IDLE" ? "bg-slate-500" :
                                state === "ANALYZING" ? "bg-sky-500" :
                                    state === "SIMULATING" ? "bg-amber-500" :
                                        state === "SIGNING" ? "bg-violet-500" :
                                            state === "EXECUTING" ? "bg-emerald-500" : "bg-slate-500"
                        )} />
                        {state === "EXECUTING" && <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-widest">SENTINEL-ALPHA-01</h3>
                        <p className="text-[10px] text-slate-500">TEE_ENCLAVE_ID: 0x4f...9a21</p>
                    </div>
                </div>
                <div className="flex gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1 text-slate-400">
                        <ShieldCheck size={14} />
                        <span>TEE SECURE</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Lock size={14} />
                        <span>LIT PROTOCOL</span>
                    </div>
                </div>
            </div>

            {/* Visualization Area */}
            <div className="h-48 relative border-b border-slate-800 bg-slate-950 flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={state}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        {state === "IDLE" && <Activity size={48} className="text-slate-600" />}
                        {state === "ANALYZING" && <Activity size={48} className="text-sky-500 animate-pulse" />}
                        {state === "SIMULATING" && <Terminal size={48} className="text-amber-500" />}
                        {state === "SIGNING" && <Lock size={48} className="text-violet-500" />}
                        {state === "EXECUTING" && <Zap size={48} className="text-emerald-500" />}
                        {state === "COOLDOWN" && <ShieldCheck size={48} className="text-slate-500" />}

                        <span className="text-sm font-bold text-white tracking-widest uppercase">
                            {state}...
                        </span>
                    </motion.div>
                </AnimatePresence>

                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500 via-slate-950 to-slate-950" />
            </div>

            {/* Logs */}
            <div ref={logContainerRef} className="h-48 overflow-y-auto p-4 bg-black/40 text-xs space-y-1 scroll-smooth">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                        <span className="text-slate-600">[{log.timestamp}]</span>
                        <span className={cn("font-bold w-16",
                            log.level === "INFO" ? "text-slate-400" :
                                log.level === "WARN" ? "text-amber-500" :
                                    log.level === "CRITICAL" ? "text-violet-500" :
                                        "text-emerald-500"
                        )}>
                            {log.level}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
