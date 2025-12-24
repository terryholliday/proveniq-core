"use client";

import React, { useState, useEffect } from "react";

interface SecureBlurProps {
    children: React.ReactNode;
    blurAmount?: string;
}

export function SecureBlur({ children, blurAmount = "4px" }: SecureBlurProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isAltPressed, setIsAltPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Alt") setIsAltPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Alt") setIsAltPressed(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    return (
        <span
            onMouseEnter={() => setIsRevealed(true)}
            onMouseLeave={() => setIsRevealed(false)}
            className="relative cursor-crosshair inline-block group"
        >
            <span
                className="transition-all duration-200"
                style={{
                    filter: isRevealed && isAltPressed ? "none" : `blur(${blurAmount})`,
                    opacity: isRevealed && isAltPressed ? 1 : 0.7,
                    userSelect: isRevealed && isAltPressed ? 'text' : 'none',
                }}
            >
                {children}
            </span>
            {!(isRevealed && isAltPressed) && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[8px] text-slate-500 font-mono tracking-widest opacity-50 bg-slate-900/80 px-1 rounded">REDACTED</span>
                </span>
            )}
        </span>
    );
}
