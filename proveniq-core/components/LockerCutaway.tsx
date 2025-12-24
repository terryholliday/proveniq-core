"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { SafeAsset } from "./SafeAsset";

/**
 * LockerCutaway
 * 
 * Scroll-driven visualization of the secure storage hardware.
 * Strictly adheres to DoD: Scroll-linked (not time-linked) animation.
 */

export function LockerCutaway() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Smooth out the scroll value slightly
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Door Opening Animation linked to scroll
    // 0% scroll (top of view) -> Door Closed (0 deg)
    // 50% scroll (center) -> Door Open (110 deg)
    const doorRotation = useTransform(smoothProgress, [0.2, 0.6], [0, -110]);

    // Internal Lighting intensity linked to scroll
    const lightIntensity = useTransform(smoothProgress, [0.3, 0.6], [0.2, 1]);

    // Asset Slide-out logic
    const assetTranslate = useTransform(smoothProgress, [0.5, 0.8], [0, 50]);


    return (
        <div ref={containerRef} className="relative h-[200vh] w-full flex items-start justify-center pt-32">
            <div className="sticky top-1/4 perspective-1000">
                <div className="relative w-80 h-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-center overflow-visible">

                    {/* Internal Vault Space */}
                    <motion.div
                        className="absolute inset-2 bg-slate-900 rounded-lg shadow-inner flex items-center justify-center overflow-hidden"
                        style={{ opacity: lightIntensity }}
                    >
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />

                        {/* The Asset */}
                        <motion.div style={{ x: assetTranslate, zIndex: 10 }}>
                            <SafeAsset type="gold" />
                        </motion.div>
                    </motion.div>

                    {/* The Door */}
                    <motion.div
                        className="absolute inset-0 bg-slate-700 rounded-xl border border-slate-600 flex items-center justify-center origin-left z-20"
                        style={{ rotateY: doorRotation }}
                    >
                        <div className="w-4/5 h-4/5 border-2 border-dashed border-slate-500/30 rounded flex flex-col items-center justify-center gap-4">
                            <div className="text-slate-900 font-bold text-2xl drop-shadow-md">PROVENIQ</div>
                            <div className="w-16 h-16 rounded-full bg-slate-300 shadow-inner border border-slate-400 flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full" />
                            </div>
                        </div>

                        {/* Hinge visuals */}
                        <div className="absolute left-2 top-4 w-2 h-6 bg-slate-500 rounded-sm" />
                        <div className="absolute left-2 bottom-4 w-2 h-6 bg-slate-500 rounded-sm" />
                    </motion.div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-slate-500 font-mono">SCROLL TO UNLOCK</p>
                </div>
            </div>
        </div>
    );
}
