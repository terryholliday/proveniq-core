"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AUDIO } from "@/lib/audio";

export function AudioFeedback() {
    const pathname = usePathname();

    useEffect(() => {
        // Initialize audio context on first user interaction
        const initAudio = () => AUDIO.init();

        // Global click listener for UI sounds
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Simple heuristic: if it's a button or link, click sound
            if (target.closest('button') || target.closest('a')) {
                AUDIO.playClick();
            }
        };

        const handleHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('a')) {
                AUDIO.playHover();
            }
        };

        window.addEventListener("click", initAudio, { once: true });
        window.addEventListener("click", handleClick);
        // Debounce hover or just attach mostly
        // For simplicity/performance, let's keep hover minimal or specialized components will call it.
        // Actually, let's attach but be careful with performance.
        // window.addEventListener("mouseover", handleHover); 

        return () => {
            window.removeEventListener("click", initAudio);
            window.removeEventListener("click", handleClick);
            // window.removeEventListener("mouseover", handleHover);
        };
    }, []);

    // Route change sound
    useEffect(() => {
        AUDIO.playSuccess();
    }, [pathname]);

    return null; // Headless component
}
