"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Box, Check, Cpu, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightPathProps {
    intent: string;
    onComplete?: () => void;
}

type StepState = "PENDING" | "ACTIVE" | "COMPLETED";

export function FlightPath({ intent, onComplete }: FlightPathProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer1 = setTimeout(() => setStep(1), 1500); // Solver Bidding
        const timer2 = setTimeout(() => setStep(2), 3500); // Route Selected
        const timer3 = setTimeout(() => setStep(3), 5500); // Execution
        const timer4 = setTimeout(() => {
            if (onComplete) onComplete();
        }, 7500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [onComplete]);

    return (
        <div className="w-full text-slate-300 font-mono text-xs">
            {/* Intent Header */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-slate-800/50 rounded border border-slate-700">
                <span className="text-sky-500 font-bold">INTENT:</span>
                <span className="text-white italic">"{intent}"</span>
            </div>

            <div className="space-y-4 relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-800" />

                {/* 1. Solver Bidding */}
                <Step
                    title="SOLVER_AUCTION"
                    desc="Broadcasting intent to 14 solvers (CowSwap, UniswapX, Wintermute)"
                    state={step === 0 ? "ACTIVE" : step > 0 ? "COMPLETED" : "PENDING"}
                    icon={<Layers size={14} />}
                >
                    {step === 0 && (
                        <div className="mt-2 space-y-1 pl-4">
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex justify-between text-[10px] text-slate-500">
                                <span>Solver_A (0x3f...9a)</span>
                                <span className="text-emerald-500">BID: 99.98% Fill</span>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="flex justify-between text-[10px] text-slate-500">
                                <span>Solver_B (Wintermute)</span>
                                <span className="text-emerald-500">BID: 99.95% Fill</span>
                            </motion.div>
                        </div>
                    )}
                </Step>

                {/* 2. Route Selection */}
                <Step
                    title="FLIGHT_PATH_OPTIMIZATION"
                    desc="Selected Route: USDC (Base) -> Axelar -> USDC (Arb) -> mTBILL"
                    state={step === 1 ? "ACTIVE" : step > 1 ? "COMPLETED" : "PENDING"}
                    icon={<Cpu size={14} />}
                />

                {/* 3. Execution */}
                <Step
                    title="ATOMIC_SETTLEMENT"
                    desc="Executing bundle via Bundler Service..."
                    state={step === 2 ? "ACTIVE" : step > 2 ? "COMPLETED" : "PENDING"}
                    icon={<Box size={14} />}
                />

                {/* 4. Confirmation */}
                <Step
                    title="FINALITY"
                    desc="Transaction confirmed on-chain."
                    state={step >= 3 ? "COMPLETED" : "PENDING"}
                    icon={<Check size={14} />}
                    isLast
                />
            </div>
        </div>
    );
}

function Step({ title, desc, state, icon, children, isLast }: { title: string, desc: string, state: StepState, icon: React.ReactNode, children?: React.ReactNode, isLast?: boolean }) {
    return (
        <div className="relative pl-8">
            {/* Status Dot */}
            <div className={cn(
                "absolute left-[0.65rem] top-1 w-2 h-2 rounded-full border-2 z-10 bg-slate-950 transition-colors duration-500",
                state === "PENDING" ? "border-slate-700" :
                    state === "ACTIVE" ? "border-sky-500 animate-pulse bg-sky-500" :
                        "border-emerald-500 bg-emerald-500"
            )} />

            <div className={cn("transition-opacity duration-300", state === "PENDING" ? "opacity-30" : "opacity-100")}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(state === "COMPLETED" ? "text-emerald-500" : "text-white")}>{icon}</span>
                    <span className="font-bold">{title}</span>
                </div>
                <p className="text-slate-400">{desc}</p>
                {children}
            </div>
        </div>
    );
}
