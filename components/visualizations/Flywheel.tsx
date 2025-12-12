"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import { BUDGET, TIMING } from "@/lib/physics";

/**
 * PROVENIQ Flywheel
 * 
 * Visualization of the ecosystem.
 * Strictly adheres to PERFORMANCE BUDGET:
 * - Max 12 particles (Enforced via slice)
 * - Only transform/opacity animations
 * - Respects prefers-reduced-motion
 */

export function Flywheel() {
    const shouldReduceMotion = useReducedMotion();

    // Enforce Particle Budget
    const particles = useMemo(() => {
        return PROVENIQ_DNA.products.slice(0, BUDGET.flywheel.maxParticles);
    }, []);

    // Animation definitions conforming to whitelist
    const spinTransition = {
        repeat: Infinity,
        ease: "linear",
        duration: 20,
    };

    const orbitContainerVariants = {
        animate: {
            rotate: 360,
        },
        static: {
            rotate: 0,
        }
    };

    const particleVariants = {
        animate: {
            rotate: -360, // Counter-rotate to keep labels upright if needed, or just orbit
        },
        static: {
            rotate: 0,
        }
    };

    return (
        <section
            className="relative flex items-center justify-center w-full h-[600px] overflow-hidden bg-slate-950"
            aria-label="Proveniq Ecosystem Flywheel"
        >
            {/* Central Axis */}
            <div className="absolute z-10 w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <span className="font-bold text-white tracking-tighter">PROVENIQ</span>
            </div>

            {/* Orbit Ring */}
            <motion.div
                className="relative w-[400px] h-[400px] rounded-full border border-slate-800/50"
                variants={orbitContainerVariants}
                // If reduce motion is on, use 'static' variant, else 'animate'
                animate={shouldReduceMotion ? "static" : "animate"}
                transition={shouldReduceMotion ? {} : spinTransition}
                style={{ willChange: "transform" }} // Optimization hint
            >
                {particles.map((product, index) => {
                    // Distribute particles evenly on the circle
                    const angle = (index / particles.length) * 360;

                    return (
                        <div
                            key={product.id}
                            className="absolute top-1/2 left-1/2 w-0 h-0"
                            style={{
                                transform: `rotate(${angle}deg) translateX(200px)`, // 200px radius
                            }}
                        >
                            {/* Particle Node */}
                            <motion.div
                                className="flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
                                // Counter-rotate logic could be here if we want text upright, 
                                // but strictly following transform/opacity implies keeping it simple.
                                // We will just render a simple node.
                                variants={particleVariants}
                                animate={shouldReduceMotion ? "static" : "animate"}
                                transition={shouldReduceMotion ? {} : spinTransition}
                            >
                                <div
                                    className="w-12 h-12 rounded-full bg-slate-900 border border-sky-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.15)] max-w-none"
                                >
                                    <span className="text-[10px] font-mono text-sky-500">{product.id.substring(0, 2).toUpperCase()}</span>
                                </div>

                                {/* Label - hidden on motion to reduce paint cost, visible on hover or simplified */}
                                <span className="absolute mt-16 text-xs text-slate-500 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {product.label}
                                </span>
                            </motion.div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Accessibility Note only visible to screen readers */}
            <div className="sr-only">
                Active ecosystem products: {particles.map(p => p.label).join(", ")}.
            </div>
        </section>
    );
}
