'use client';
import { useState } from 'react';
import { Key, AlertTriangle } from 'lucide-react';
import { useCircuitBreaker } from '@/lib/security/circuit-breaker';

export const GodKeyModal = () => {
    const [key, setKey] = useState('');
    const { reset } = useCircuitBreaker();
    const engage = () => { if (key === 'OMEGA_OVERRIDE') reset(); };
    return (
        <div className="border border-red-900/50 bg-red-950/10 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-500 font-mono font-bold text-sm"><AlertTriangle className="w-4 h-4" /> SOVEREIGN INTERVENTION</div>
            <input type="password" onChange={(e) => setKey(e.target.value)} className="bg-slate-950 border border-red-900/30 text-red-500 font-mono text-xs p-2" placeholder="ENTER GOD KEY" />
            <button onClick={engage} className="bg-red-900/20 text-red-500 py-2 rounded font-bold text-xs flex items-center justify-center gap-2"><Key className="w-3 h-3" /> OVERRIDE</button>
        </div>
    );
};
