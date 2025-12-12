'use client';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useSentinelStore } from '@/lib/sentinels/engine';
import { useEffect } from 'react';

export const SentinelDashboard = () => {
    const { agents, tick } = useSentinelStore();
    useEffect(() => { const i = setInterval(tick, 1000); return () => clearInterval(i); }, [tick]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {agents.map(agent => (
                <div key={agent.id} className="border border-slate-800 bg-slate-950 p-5 rounded-xl">
                    <div className="flex justify-between mb-4"><h3 className="font-mono font-bold">{agent.name}</h3><Activity className={`w-4 h-4 ${agent.status === 'EXECUTING' ? 'text-emerald-500 animate-bounce' : 'text-slate-500'}`} /></div>
                    <div className="text-xs font-mono text-slate-500">TARGET: {agent.target} | CURRENT: {agent.current}</div>
                </div>
            ))}
        </div>
    );
};
