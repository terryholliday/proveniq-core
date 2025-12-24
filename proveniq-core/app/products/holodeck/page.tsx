"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    ConstellationView, 
    buildConstellationFromDNA,
    type ConstellationNode 
} from "@/components/visualizations/Constellation";
import { PROVENIQ_DNA } from "@/lib/config";

export default function HolodeckPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Build constellation data from DNA
    const constellationData = useMemo(() => {
        return buildConstellationFromDNA(PROVENIQ_DNA.products);
    }, []);

    const handleNodeClick = (node: ConstellationNode) => {
        setSelectedNode(node);
    };

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-4 overflow-hidden">
            <header className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">HOLODECK</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">
                        Spatial Analytics // Force-Directed Portfolio Topology
                    </p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>NODES: <span className="text-emerald-500">{constellationData.nodes.length}</span></div>
                    <div>LINKS: <span className="text-sky-500">{constellationData.links.length}</span></div>
                    <div>RENDER: <span className="text-white">WEBGL2</span></div>
                </div>
            </header>

            {/* Selected Node Info Panel */}
            {selectedNode && (
                <div className="flex-shrink-0 bg-slate-900/80 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: selectedNode.color }} 
                        />
                        <div>
                            <span className="text-white font-bold">{selectedNode.label}</span>
                            <span className="text-slate-500 mx-2">·</span>
                            <span className="text-slate-400 text-sm font-mono">
                                {selectedNode.type} / {selectedNode.role}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-500 hover:text-white text-xs font-mono"
                    >
                        [CLEAR]
                    </button>
                </div>
            )}

            <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-0">
                {mounted && (
                    <ConstellationView 
                        data={constellationData} 
                        onNodeClick={handleNodeClick}
                        enableNavigation={true}
                    />
                )}
            </div>

            {/* Controls hint */}
            <div className="flex-shrink-0 flex justify-center gap-6 text-xs font-mono text-slate-600">
                <span>DRAG: Rotate</span>
                <span>SCROLL: Zoom</span>
                <span>CLICK: Navigate to Product</span>
            </div>
        </div>
    );
}
