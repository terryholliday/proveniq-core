"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

export function LatencySim() {
    // Controls
    const [threads, setThreads] = useState(2); // 1-16
    const [batchSize, setBatchSize] = useState(500); // 100-5000

    // Physics State
    const [tps, setTps] = useState(0);
    const [latency, setLatency] = useState(10); // ms
    const [dlq, setDlq] = useState(0);
    const [crashed, setCrashed] = useState(false);

    // Simulation Loop
    useEffect(() => {
        if (crashed) return;

        const interval = setInterval(() => {
            // Physics Engine
            // More threads = Higher TPS but Higher Contentions (Latency)
            // Larger Batch = Higher Throughput but Spike Latency

            const baseLatency = 5; // Network overhead
            const processingTime = (batchSize * 0.05) / threads; // Simulate compute
            const contention = threads * threads * 0.5; // Lock contention scaling

            const currentLatency = baseLatency + processingTime + contention;
            const currentTps = Math.floor((1000 / currentLatency) * batchSize * threads);

            setLatency(Math.floor(currentLatency));
            setTps(currentTps);

            // Crash Condition: Latency > 100ms or 10k TPS with bad config (too many threads)
            if (currentLatency > 100) {
                setCrashed(true);
            }

            // Target: 10k TPS with < 50ms latency
            // Optimal: Threads 4-8, Batch 1000-2000

        }, 500);

        return () => clearInterval(interval);
    }, [threads, batchSize, crashed]);

    const reset = () => {
        setThreads(2);
        setBatchSize(500);
        setLatency(10);
        setCrashed(false);
    };

    if (crashed) {
        return (
            <div className="bg-red-950 border border-red-500 p-8 rounded-lg text-center animate-pulse">
                <AlertTriangle className="mx-auto text-red-500 mb-4 h-16 w-16" />
                <h2 className="text-2xl font-bold text-red-500 mb-2">SYSTEM CRITICAL FAILURE</h2>
                <p className="font-mono text-red-400 mb-6">P99 Latency Exceeded 100ms. Ingest Halted.</p>
                <button
                    onClick={reset}
                    className="bg-red-900/50 hover:bg-red-800 text-white px-6 py-2 rounded font-mono border border-red-500 flex items-center gap-2 mx-auto"
                >
                    <RefreshCw size={16} /> REBOOT SHARD
                </button>
            </div>
        )
    }

    return (
        <div className="bg-black border border-slate-800 p-6 rounded-lg font-mono text-xs">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-emerald-500 font-bold flex items-center gap-2">
                    <Activity size={16} /> FLYWHEEL SIMULATOR v1.0
                </h3>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-slate-500">THROUGHPUT</div>
                        <div className="text-white text-lg font-bold">{tps.toLocaleString()} TPS</div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-500">P99 LATENCY</div>
                        <div className={`text-lg font-bold ${latency > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {latency}ms
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Visualizer */}
                <div className="h-32 bg-slate-900/50 rounded border border-slate-800 relative overflow-hidden flex items-end px-1 gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: "10%" }}
                            animate={{
                                height: `${Math.min(100, Math.max(5, (latency / 100) * 100 + (Math.random() * 20)))}%`, // Jitter
                                backgroundColor: latency > 50 ? '#f59e0b' : '#10b981'
                            }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 rounded-t opacity-80"
                        />
                    ))}
                    <div className="absolute top-2 right-2 text-[10px] text-slate-500">
                        INGEST BUFFER
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="flex justify-between mb-2 text-slate-400">
                            <span>WORKER THREADS</span>
                            <span className="text-white">{threads}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="32"
                            step="1"
                            value={threads}
                            onChange={(e) => setThreads(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="mt-1 text-[10px] text-slate-600">
                            Warning: High thread count increases lock contention.
                        </p>
                    </div>

                    <div>
                        <label className="flex justify-between mb-2 text-slate-400">
                            <span>BATCH SIZE</span>
                            <span className="text-white">{batchSize}</span>
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            step="100"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="mt-1 text-[10px] text-slate-600">
                            Warning: Large batches spike P99 latency.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 mt-4">
                    <h4 className="flex items-center gap-2 mb-1 text-slate-300">
                        <Server size={12} /> OPTIMIZATION_GOAL
                    </h4>
                    <p className="text-slate-500 leading-tight">
                        Maintain 10,000 TPS while keeping Latency {'<'} 50ms.
                        Do not saturate the CPU (Threads) or the Bus (Batch).
                    </p>
                </div>
            </div>
        </div>
    );
}
