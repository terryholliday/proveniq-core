"use client";

import React, { useState, useEffect } from "react";
import { Constellation } from "@/components/visualizations/Constellation";

export default function HolodeckPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6 overflow-hidden">
            <header className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">HOLODECK</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">Spatial Analytics // Force-Directed Portfolio Topology</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>RENDER: <span className="text-sky-500">WEBGL2</span></div>
                    <div>PHYSICS: <span className="text-white">VERLET_INTEGRATION</span></div>
                </div>
            </header>

            <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
                {/* 
                  Note: ForceGraph3D handles its own resize broadly, 
                  but needs a container with defined dimensions.
                */}
                {mounted && <Constellation />}
            </div>
        </div>
    );
}
