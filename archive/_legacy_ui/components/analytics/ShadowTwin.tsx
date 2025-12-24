'use client';
import { useState, useEffect } from 'react';
import { GitCompare } from 'lucide-react';

export const ShadowTwin = ({ currentPnl }: { currentPnl: number }) => {
    const [shadowPnl, setShadowPnl] = useState(0);
    useEffect(() => setShadowPnl(currentPnl * -0.8 + (Math.random() * 5)), [currentPnl]);
    const isWarning = shadowPnl > currentPnl;

    return (
        <div className={`border rounded-lg p-4 flex flex-col gap-2 ${isWarning ? 'bg-red-950/20 border-red-900' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                    <GitCompare className="w-4 h-4" />
                    <span className="uppercase tracking-widest">Shadow Protocol (Inverted)</span>
                </div>
                {isWarning && <span className="text-xs text-red-500 font-bold animate-pulse">THESIS INVALID</span>}
            </div>
            <div className="flex justify-between items-end mt-2">
                <div className="text-right text-emerald-500 font-mono">+{currentPnl.toFixed(2)}%</div>
                <div className={`text-right font-mono ${shadowPnl > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{shadowPnl.toFixed(2)}%</div>
            </div>
        </div>
    );
};
