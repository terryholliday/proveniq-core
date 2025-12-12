"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemStore } from "@/lib/store";
import { Fingerprint, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { AUDIO } from "@/lib/audio";

export function BiometricGate() {
    const login = useSystemStore((state) => state.login);
    const logAction = useSystemStore((state) => state.logAction);

    // ZK-Passport State
    const [zkState, setZkState] = useState<"IDLE" | "SCANNING" | "PROVING" | "VERIFIED">("IDLE");

    const initiateZkPassthrough = () => {
        if (zkState !== "IDLE") return;

        // 1. Scan Phase
        setZkState("SCANNING");
        AUDIO.playClick();

        // 2. Proving Phase (2s)
        setTimeout(() => {
            setZkState("PROVING");
            if (AUDIO.setDrone) AUDIO.setDrone(0.5); // Increase tension
            logAction("ZK_CIRCUIT_INIT", "Generating Zero-Knowledge Proof for <AccreditedInvestor>");
        }, 2000);

        // 3. Verification Phase (4s total)
        setTimeout(() => {
            setZkState("VERIFIED");
            AUDIO.playSuccess();
            logAction("ZK_PROOF_VERIFIED", "Identity obscured. Claims validated.");

            // Final Login
            setTimeout(() => {
                login("OPERATOR_PROVENIQ", "L3_ARCHITECT");
            }, 1500);
        }, 4500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">

                {/* State: IDLE / SCANNING (Fingerprint) */}
                <AnimatePresence mode="wait">
                    {(zkState === "IDLE" || zkState === "SCANNING") && (
                        <motion.button
                            key="fingerprint-button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={initiateZkPassthrough}
                            className="relative z-10 p-8 rounded-full border border-slate-700 bg-slate-900 shadow-[0_0_50px_rgba(16,185,129,0.1)] group"
                        >
                            <Fingerprint
                                size={64}
                                className={clsx(
                                    "transition-colors duration-500",
                                    zkState === "SCANNING" ? "text-emerald-400 animate-pulse" : "text-slate-500 group-hover:text-emerald-500"
                                )}
                            />
                            {zkState === "SCANNING" && (
                                <motion.div
                                    className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* State: PROVING (Chaotic Swarm) */}
                {(zkState === "PROVING") && (
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-500 rounded-full"
                                initial={{
                                    x: (Math.random() - 0.5) * 200,
                                    y: (Math.random() - 0.5) * 200,
                                    opacity: 0,
                                    scale: 0
                                }}
                                animate={{
                                    x: [null, (Math.random() - 0.5) * 100, 0], // Move randomly then collapse to center
                                    y: [null, (Math.random() - 0.5) * 100, 0],
                                    opacity: [0, 1, 0.5],
                                    scale: [0, 1, 0.2]
                                }}
                                transition={{
                                    duration: 2.5,
                                    ease: "easeInOut",
                                    times: [0, 0.8, 1]
                                }}
                            />
                        ))}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <span className="text-[10px] font-mono text-emerald-500 bg-black/50 px-2 rounded">GENERATING_PROOF...</span>
                        </motion.div>
                    </div>
                )}

                {/* State: VERIFIED (Checkmark) */}
                {zkState === "VERIFIED" && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="relative z-10 p-6 rounded-full bg-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.5)]"
                    >
                        <ShieldCheck size={48} className="text-slate-950" />
                    </motion.div>
                )}
            </div>

            {/* Status Text Area */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                    {zkState === "IDLE" && "Use ZK-Passport"}
                    {zkState === "SCANNING" && "Reading Biometrics"}
                    {zkState === "PROVING" && "Compiling ZKp Circuit"}
                    {zkState === "VERIFIED" && "Access Granted"}
                </h2>
                <p className="text-xs font-mono text-slate-500">
                    {zkState === "IDLE" && "SECURE_ENCLAVE_READY"}
                    {zkState === "SCANNING" && "ACQUIRING_TOUCH_ID"}
                    {zkState === "PROVING" && "OBSCURING_PUBLIC_KEY_METADATA"}
                    {zkState === "VERIFIED" && "SESSION_TOKEN_MINTED_ON_CHAIN"}
                </p>
            </div>
        </div>
    );
}
