"use client";

import React, { useRef, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { generateTopology, Asset } from '@/lib/topology'; // Import topology utilities

// Dynamically import to avoid SSR issues with WebGL/Window
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-950 animate-pulse text-white flex items-center justify-center font-mono text-xs">INITIALIZING_HOLODECK...</div>
});

// --- CONFIGURATION (The DNA) ---
const NODE_COLORS = {
    TREASURY: '#10b981',    // Emerald-500
    REAL_ESTATE: '#3b82f6', // Blue-500
    CRYPTO: '#f59e0b',      // Amber-500
};

// --- MOCK DATA GENERATOR ---
const generateMockAssets = (): Asset[] => {
    const assets: Asset[] = [];
    const SECTORS: Asset['sector'][] = ['TREASURY', 'REAL_ESTATE', 'CRYPTO'];

    for (let i = 0; i < 80; i++) {
        const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
        assets.push({
            id: `ASSET_${i}`,
            ticker: `${sector.substring(0, 3)}_${i}`,
            sector: sector,
            tvl: Math.random() * 20 + 5,
            riskRating: Math.random() * 100 // 0-100
        });
    }
    return assets;
};

// Wrapper for Page Usage
import { ScrollSafeWrapper } from '@/components/visualizations/ScrollSafeWrapper';

export const ConstellationInternal = ({ data }: { data: ReturnType<typeof generateTopology> }) => {
    const fgRef = useRef<any>();

    // --- CUSTOM NODE RENDERER (The "Antigravity" Look) ---
    const nodeThreeObject = useCallback((node: any) => {
        // Note: generateTopology returns nodes with 'val' and 'riskScore' used here
        // Geometry: Icosahedron looks more "tech" than a Sphere
        const geometry = new THREE.IcosahedronGeometry(Math.cbrt(node.val) * 2, 1);

        // Material: Glassy, Emissive
        const color = NODE_COLORS[node.group as keyof typeof NODE_COLORS] || '#ffffff';
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9,
            transmission: 0.2, // Glass effect
            wireframe: false,
        });

        return new THREE.Mesh(geometry, material);
    }, []);

    // --- LINK STYLING ---
    // Only show links that are statistically significant (> 0.3 correlation)
    const linkVisibility = useCallback((link: any) => {
        return link.strength > 0.3;
    }, []);

    const linkWidth = useCallback((link: any) => {
        return link.strength * 0.5;
    }, []);

    return (
        <ScrollSafeWrapper className="rounded-xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
            {(isInteractive: boolean) => (
                <>
                    {/* HUD OVERLAY */}
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-[0.2em]">
                            Constellation // Risk Topology
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-500">LIVE PHYSICS</span>
                        </div>
                    </div>

                    <ForceGraph3D
                        ref={fgRef}
                        graphData={data}

                        // Physics Engine
                        cooldownTicks={100} // Stop moving after stabilization to save GPU
                        d3VelocityDecay={0.1}

                        // Rendering
                        backgroundColor="rgba(0,0,0,0)" // Transparent
                        showNavInfo={false}

                        // Interaction Gating
                        enableZoom={isInteractive}
                        enablePan={isInteractive}
                        enableRotate={true} // Safe to leave rotation enabled for immersive feel
                        enableNodeDrag={isInteractive} // Optional: prevents accidental dragging too

                        // Objects
                        nodeThreeObject={nodeThreeObject}
                        nodeLabel="name"

                        // Links
                        linkColor={() => "#334155"} // Slate-700
                        linkWidth={linkWidth}
                        linkVisibility={linkVisibility}
                        linkDirectionalParticles={2} // Data flow visualization
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleWidth={1}

                        // Interaction
                        onNodeClick={(node: any) => {
                            // PROVENIQ Camera Movement: Fly to the node
                            const distance = 40;
                            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

                            fgRef.current.cameraPosition(
                                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                                node, // lookAt ({ x, y, z })
                                3000  // ms transition duration
                            );
                        }}
                    />
                </>
            )}
        </ScrollSafeWrapper>
    );
};

// Wrapper for Page Usage
export function Constellation() {
    const [data] = useState(() => generateTopology(generateMockAssets()));
    return <ConstellationInternal data={data} />;
}
