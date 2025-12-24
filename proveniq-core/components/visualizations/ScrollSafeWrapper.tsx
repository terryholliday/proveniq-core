"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Command } from 'lucide-react';

interface ScrollSafeWrapperProps {
    children: (isInteractive: boolean) => React.ReactNode;
    className?: string;
}

export const ScrollSafeWrapper = ({ children, className }: ScrollSafeWrapperProps) => {
    const [isInteractive, setIsInteractive] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Toggle interaction based on modifier key (CTRL/CMD)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) setIsInteractive(true);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) setIsInteractive(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Handle Wheel Events to show hint
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (isHovered && !isInteractive) {
            // If user tries to scroll while hovering but NOT holding Ctrl
            // We don't preventDefault here because we WANT the page to scroll
            setShowHint(true);

            // Debounce hiding the hint
            const timer = setTimeout(() => setShowHint(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [isHovered, isInteractive]);

    return (
        <div
            className={cn("relative group w-full h-full", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setShowHint(false);
            }}
            onWheel={handleWheel}
        >
            {/* Render Function Pattern:
        We pass the state down so the child (Constellation) knows to enable/disable controls 
      */}
            {children(isInteractive)}

            {/* INTERACTION HINT OVERLAY */}
            <div
                className={cn(
                    "absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] transition-all duration-300 pointer-events-none",
                    showHint ? "opacity-100" : "opacity-0"
                )}
            >
                <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/90 shadow-2xl transform translate-y-0">
                    <Command className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono text-slate-200 tracking-wide">
                        HOLD <span className="text-emerald-400 font-bold">CTRL</span> TO ZOOM
                    </span>
                </div>
            </div>

            {/* VISUAL INDICATOR (Corner Status) */}
            <div className={cn(
                "absolute bottom-4 right-4 z-40 transition-opacity duration-300 pointer-events-none",
                isInteractive ? "opacity-100" : "opacity-30"
            )}>
                <div className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded bg-slate-900/50 border border-slate-800",
                    isInteractive ? "border-emerald-500/50" : ""
                )}>
                    <div className={cn(
                        "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]",
                        isInteractive ? "bg-emerald-500 text-emerald-500 animate-pulse" : "bg-slate-600 text-slate-600"
                    )} />
                    <span className={cn("text-[8px] font-mono", isInteractive ? "text-emerald-500" : "text-slate-600")}>
                        {isInteractive ? "LOCKED_ON" : "PASSIVE"}
                    </span>
                </div>
            </div>
        </div>
    );
};
