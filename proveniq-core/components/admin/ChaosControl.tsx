'use client';
import { Skull, ZapOff, WifiOff } from 'lucide-react';
import { useChaosEngine } from '@/lib/testing/chaos-engine';

export const ChaosControl = () => {
    const { toggleScenario, scenarios } = useChaosEngine();
    return (
        <div className="border border-amber-900/50 bg-amber-950/10 p-4 rounded-xl mt-4">
            <div className="flex items-center gap-2 text-amber-500 font-mono font-bold text-sm mb-3">
                <Skull className="w-4 h-4" /> CHAOS SIMULATION LAB
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => toggleScenario('usdcDepeg')} className={`text-xs border p-2 rounded ${scenarios.usdcDepeg ? 'bg-red-500 text-white' : 'border-amber-900 text-amber-600'}`}>SIMULATE DE-PEG</button>
                <button onClick={() => toggleScenario('latencySpike')} className={`text-xs border p-2 rounded flex items-center justify-center gap-1 ${scenarios.latencySpike ? 'bg-red-500 text-white' : 'border-amber-900 text-amber-600'}`}><WifiOff className="w-3 h-3" /> LAG SPIKE</button>
            </div>
        </div>
    );
};
