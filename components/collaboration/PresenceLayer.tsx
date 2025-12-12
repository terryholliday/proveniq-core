'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// In prod, use Yjs or PartyKit. Here we simulate the 'Ghost' of a colleague.

export const PresenceLayer = ({ children }: { children: React.ReactNode }) => {
    const [peers, setPeers] = useState<{ id: string, x: number, y: number, color: string }[]>([]);

    useEffect(() => {
        // Simulation: A 'Ghost' analyst moving around your screen
        const interval = setInterval(() => {
            setPeers([{ id: 'analyst-1', x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, color: '#10b981' }]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full">
            {children}
            {peers.map(p => (
                <motion.div
                    key={p.id}
                    className="pointer-events-none fixed z-50 flex items-center gap-2"
                    animate={{ x: p.x, y: p.y }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill={p.color} stroke="white" strokeWidth="2" />
                    </svg>
                    <span className="bg-slate-900 text-[10px] font-mono px-1 rounded border border-slate-700 text-white">Analyst_01</span>
                </motion.div>
            ))}
        </div>
    );
};
