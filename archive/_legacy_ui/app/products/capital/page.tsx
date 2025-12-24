"use client";

import React, { useState, useEffect } from "react";
import { PROVENIQ_DNA } from "@/lib/config";
import { YieldCurve } from "@/components/charts/YieldCurve";
import { OrderDepth } from "@/components/charts/OrderDepth";
import { motion } from "framer-motion";

export default function CapitalPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "capital");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6 overflow-y-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Predictive Analytics</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>ALGO: <span className="text-sky-500">BLACK-SCHOLES-M</span></div>
                    <div>STATUS: <span className="text-emerald-500">CONVERGING</span></div>
                </div>
            </header>

            {/* Grid Layout for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">

                {/* Yield Curve Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="p-4 rounded border border-slate-800 bg-slate-900/30">
                        <h2 className="text-xl font-bold text-white mb-2">Yield Projections</h2>
                        <p className="text-sm text-slate-400 mb-6">Real-time yield curve construction based on simulated treasury data. Used for discount rate calculation on long-tail assets.</p>

                        <div className="h-[350px]">
                            {mounted && <YieldCurve />}
                        </div>
                    </div>
                </motion.div>

                {/* Market Depth Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="p-4 rounded border border-slate-800 bg-slate-900/30">
                        <h2 className="text-xl font-bold text-white mb-2">Liquidity Depth</h2>
                        <p className="text-sm text-slate-400 mb-6">Aggregate order book depth for the "Blue Diamond" simulated asset class. Visualizes bid/ask spread liquidity.</p>

                        <div className="h-[350px]">
                            {mounted && <OrderDepth />}
                        </div>
                    </div>
                </motion.div>

                {/* Additional KPI Cards (Simulated) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    {['VaR (99%)', 'Sharp Ratio', 'Alpha', 'Beta'].map((kpi, i) => (
                        <div key={kpi} className="p-4 rounded border border-slate-800 bg-slate-900 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-mono text-slate-500 uppercase">{kpi}</span>
                            <span className="text-2xl font-bold text-white mt-1">{(Math.random() * 2).toFixed(2)}</span>
                        </div>
                    ))}
                </motion.div>

            </div>
        </div>
    );
}
