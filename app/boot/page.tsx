"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import { AUDIO } from "@/lib/audio";

import { Constellation } from "@/components/visualizations/Constellation";

export default function BootPage() {
    const router = useRouter();

    useEffect(() => {
        // Start Drone
        AUDIO.init();

        const timer = setTimeout(() => {
            // Redirect to marketing after sequence
            router.push("/");
        }, 4500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-xl p-8 font-mono text-sm leading-relaxed relative z-10">
                <SequenceLine delay={0.2} text="> INITIALIZING KERNEL v3.2..." color="text-slate-500" />
                <SequenceLine delay={0.8} text="> LOADING DNA SEQUENCE..." color="text-slate-400" />
                <SequenceLine delay={1.4} text="> DNA::VERIFIED [OK]" color="text-emerald-500" />
                <SequenceLine delay={2.0} text="> ESTABLISHING SECURE UPLINK..." color="text-slate-400" />
                <SequenceLine delay={2.8} text="> PROVENIQ::ONLINE" color="text-sky-500 font-bold text-xl mt-4 block" />

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
                    className="mt-8 h-1 bg-sky-500 rounded-full"
                />
            </div>

            {/* GPU WARMUP (Constellation Shader Pre-compile) */}
            <div className="absolute inset-0 opacity-0 pointer-events-none z-0">
                {/* Render a tiny Constellation to force WebGL context creation */}
                <div className="w-1 h-1 overflow-hidden">
                    <Constellation />
                </div>
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 z-[-1] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
    );
}

function SequenceLine({ delay, text, color }: { delay: number, text: string, color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={color}
        >
            {text}
        </motion.div>
    );
}
