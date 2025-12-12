"use client";

import React from "react";

/**
 * SafeAsset
 * 
 * Represents the physical item stored within the Locker.
 * Designed to be purely presentational and swappable.
 */

interface SafeAssetProps {
    type?: "gold" | "diamond" | "certificate";
}

export function SafeAsset({ type = "gold" }: SafeAssetProps) {
    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />

            {/* Physical Representation */}
            {type === "gold" && (
                <div className="relative w-24 h-12 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-lg transform -rotate-12 shadow-2xl border border-yellow-400/50 flex items-center justify-center">
                    <div className="text-[10px] font-bold text-yellow-900 opacity-60 uppercase tracking-widest">999.9</div>
                </div>
            )}

            {type === "diamond" && (
                <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-100 via-white to-cyan-300 rotate-45 transform shadow-[0_0_30px_rgba(165,243,252,0.5)]" />
            )}

            {type === "certificate" && (
                <div className="relative w-20 h-28 bg-slate-100/90 rounded border border-slate-300 flex flex-col items-center justify-start py-2">
                    <div className="w-12 h-1 bg-slate-800 mb-1" />
                    <div className="space-y-1 w-full px-2">
                        <div className="w-full h-0.5 bg-slate-400" />
                        <div className="w-full h-0.5 bg-slate-400" />
                        <div className="w-2/3 h-0.5 bg-slate-400" />
                    </div>
                    <div className="pt-8 text-[6px] font-serif text-slate-900">DEED</div>
                </div>
            )}
        </div>
    );
}
