"use client";

import { useEffect, useRef } from "react";
import { useSystemStore } from "@/lib/store";

interface SystemState {
    logout: () => void;
    isAuthenticated: boolean;
}

export function DeadManSwitch({ timeoutMs = 60000 }: { timeoutMs?: number }) {
    const logout = useSystemStore((state: SystemState) => state.logout);
    const isAuthenticated = useSystemStore((state: SystemState) => state.isAuthenticated);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                console.warn("Dead Man Switch Triggered: Session Terminated");
                logout();
            }, timeoutMs);
        };

        const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];

        // Initial start
        resetTimer();

        activityEvents.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [isAuthenticated, logout, timeoutMs]);

    return null; // Headless component
}
