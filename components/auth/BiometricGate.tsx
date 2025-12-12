"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSystemStore } from "@/lib/store";

export function BiometricGate() {
    const login = useSystemStore((state) => state.login);
    const [scanning, setScanning] = useState(false);

    const handleAuth = () => {
        setScanning(true);
        // Simulate biometric scan delay
        setTimeout(() => {
            login("OPERATOR_PROVENIQ", "L3_ARCHITECT");
            setScanning(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                {/* Scanning Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-sky-500/20"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {scanning && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-t-2 border-sky-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                )}

                <button
                    onClick={handleAuth}
                    className="relative z-10 w-48 h-48 rounded-full bg-slate-900 border border-slate-700 hover:border-sky-500/50 transition-colors flex flex-col items-center justify-center group overflow-hidden"
                >
                    <div className={`absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity ${scanning ? 'animate-pulse' : ''}`} />

                    <svg className="w-16 h-16 text-slate-500 group-hover:text-sky-500 transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 2.85M6.433 4.309A8.008 8.008 0 004 8c0 .245.011.488.032.729" />
                    </svg>
                    <span className="text-xs font-mono text-slate-400 group-hover:text-white">
                        {scanning ? "VERIFYING IDENTITY..." : "TOUCH ID"}
                    </span>
                </button>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-widest text-white">PROVENIQ SENTINEL</h1>
                <p className="text-sm text-slate-500 font-mono">RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY</p>
            </div>
        </div>
    );
}
