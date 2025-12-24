'use client';
import { Activity, Server, AlertTriangle } from 'lucide-react';

const NODES = [
    { id: 'mobile-app-v1', region: 'us-east', latency: 24, status: 'HEALTHY' },
    { id: 'web-terminal-pro', region: 'eu-central', latency: 45, status: 'HEALTHY' },
    { id: 'defi-agent-node', region: 'asia-northeast', latency: 120, status: 'DEGRADED' }
];

export const FleetStatus = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {NODES.map(node => (
            <div key={node.id} className={`border p-4 rounded-lg flex items-center justify-between ${node.status === 'HEALTHY' ? 'border-slate-800 bg-slate-950' : 'border-amber-900/50 bg-amber-950/10'}`}>
                <div className="flex items-center gap-3">
                    <Server className={`w-5 h-5 ${node.status === 'HEALTHY' ? 'text-slate-500' : 'text-amber-500'}`} />
                    <div>
                        <div className="text-xs font-mono font-bold text-slate-200">{node.id}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{node.region}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-xs font-mono ${node.status === 'HEALTHY' ? 'text-emerald-500' : 'text-amber-500'}`}>{node.status}</div>
                    <div className="text-[10px] text-slate-600">{node.latency}ms</div>
                </div>
            </div>
        ))}
    </div>
);
