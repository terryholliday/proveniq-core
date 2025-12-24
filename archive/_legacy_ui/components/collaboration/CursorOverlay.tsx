"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface RemoteUser {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
    activity?: string; // e.g. "Analyzing Yield..."
}

// --- Mock CRDT Engine (Simulated PartyKit) ---
const MOCK_USERS = [
    { id: 'u1', name: 'Alara (Risk)', color: '#10b981' }, // Emerald
    { id: 'u2', name: 'Kai (Quant)', color: '#f59e0b' },  // Amber
    { id: 'u3', name: 'Sven (Audit)', color: '#3b82f6' }, // Blue
];

function useCollaborativePresence() {
    const [users, setUsers] = useState<RemoteUser[]>([]);

    useEffect(() => {
        // Initialize fake users
        const initialUsers = MOCK_USERS.map(u => ({
            ...u,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
        }));
        setUsers(initialUsers);

        // Simulation Loop
        const interval = setInterval(() => {
            setUsers(prev => prev.map(u => {
                // Browninan Motion for "Natural" mouse movement
                const dx = (Math.random() - 0.5) * 100;
                const dy = (Math.random() - 0.5) * 100;

                // Keep in bounds
                const newX = Math.max(0, Math.min(window.innerWidth, u.x + dx));
                const newY = Math.max(0, Math.min(window.innerHeight, u.y + dy));

                // Random Activity Status
                const activity = Math.random() > 0.95
                    ? ["Highlighting Gap", "Reviewing Policy", "Checking Spline"][Math.floor(Math.random() * 3)]
                    : undefined;

                return { ...u, x: newX, y: newY, activity: activity || u.activity };
            }));
        }, 800); // 800ms tick for "laggy" but smooth connection feel

        return () => clearInterval(interval);
    }, []);

    return users;
}

// --- Cursor Component ---
function Cursor({ user }: { user: RemoteUser }) {
    return (
        <motion.div
            initial={false}
            animate={{ x: user.x, y: user.y }}
            transition={{
                type: "spring",
                damping: 25,
                stiffness: 120,
                mass: 0.2 // Lightweight feel
            }}
            className="fixed top-0 left-0 pointer-events-none z-50 flex flex-col items-start"
            style={{ x: user.x, y: user.y }}
        >
            {/* SVG Mouse Pointer */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={user.color}
                    stroke="white"
                    strokeWidth="1" // Crisp edge
                />
            </svg>

            {/* Name Tag */}
            <div
                className="ml-4 mt-2 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-lg whitespace-nowrap"
                style={{ backgroundColor: user.color }}
            >
                {user.name}
                {user.activity && (
                    <span className="opacity-75 font-normal ml-1 border-l border-white/20 pl-1">
                        — {user.activity}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// --- Main Overlay ---
export function CursorOverlay() {
    const users = useCollaborativePresence();
    const [visible, setVisible] = useState(true);

    // Toggle with 'Alt+C' or similar if needed, but per SOTA we keep it on.

    if (!visible) return null;

    return (
        <div className="pointer-events-none z-[9999]">
            {users.map(u => (
                <Cursor key={u.id} user={u} />
            ))}
        </div>
    );
}
