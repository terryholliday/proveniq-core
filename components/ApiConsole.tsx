"use client";

import React, { useEffect, useState, useRef } from "react";
import { PROVENIQ_DNA } from "@/lib/config";

const COMMANDS = [
    "> INITIALIZING KERNEL...",
    "> LOADING DNA SEQUENCE...",
    "> CHECKING INTEGRITY...",
    "> VERIFYING PROVENANCE...",
    "> KERNEL::OK",
    "> ORCHESTRATION::READY"
];

export function ApiConsole() {
    const [lines, setLines] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < COMMANDS.length) {
                setLines((prev) => [...prev, COMMANDS[currentIndex]]);
                currentIndex++;
            } else {
                // Reset for loop effect, or just stop
                setTimeout(() => {
                    setLines([]);
                    currentIndex = 0;
                }, 3000);
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [lines]);

    return (
        <div className="w-full font-mono text-xs bg-black/80 border border-slate-800 rounded-lg p-4 h-48 overflow-hidden shadow-inner">
            <div className="flex items-center gap-1.5 mb-2 opacity-50">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
            </div>
            <div className="space-y-1">
                {lines.map((line, i) => (
                    <div key={i} className="text-emerald-500/90 break-all">
                        {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
