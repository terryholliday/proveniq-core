"use client";

import React, { useState, useEffect } from "react";
import { DemoOverlay } from "./DemoOverlay";

export function InvestorTrigger() {
    const [clickCount, setClickCount] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Auto-reset clicks if idle for 2 seconds
    useEffect(() => {
        if (clickCount > 0 && clickCount < 5) {
            const timer = setTimeout(() => setClickCount(0), 2000);
            return () => clearTimeout(timer);
        }
    }, [clickCount]);

    const handleClick = () => {
        if (isActive) return;
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) {
            setIsActive(true);
        }
    };

    return (
        <aside className="border-t border-slate-900 bg-slate-950 py-6 px-8 mt-20">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="text-[10px] text-slate-600 font-mono">
                    System Version 2.4.0-stable
                </div>

                <div
                    onClick={handleClick}
                    className={`text-[10px] text-slate-700 font-mono cursor-default select-none transition-colors duration-300 ${clickCount > 0 ? "text-slate-500" : ""
                        } ${isActive ? "text-amber-500 animate-pulse" : ""}`}
                >
                    © 2025 PROVENIQ CORE. {isActive ? "[DEMO MODE ACTIVE]" : "ALL RIGHTS RESERVED."}
                </div>
            </div>

            {isActive && <DemoOverlay />}
        </aside>
    );
}
