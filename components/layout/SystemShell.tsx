"use client";

import React, { useEffect } from "react";
import { useSystemStore } from "@/lib/store";
import { BiometricGate } from "@/components/auth/BiometricGate";
import { AuditLog } from "@/components/visualizations/AuditLog";
import { AudioFeedback } from "@/components/ui/AudioFeedback";
import { TacticalHUD } from "@/components/ui/TacticalHUD";
import { DeadManSwitch } from "@/components/security/DeadManSwitch";
import { AppSidebar } from "./AppSidebar";
import { NeuralConsole } from "@/components/ui/NeuralConsole"; // Changed from NeuralPalette
import { LAYOUT } from "@/lib/physics";
import { InvestorTrigger } from "@/components/demo/InvestorTrigger";

export function SystemShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, login } = useSystemStore();
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Hydration fix / Initial load
    if (!mounted) return null;

    if (!isAuthenticated) {
        return <BiometricGate />;
    }

    return (
        <div className="flex h-screen w-full">
            <AppSidebar />
            <div
                className="flex-1 flex flex-col h-full overflow-hidden relative"
                style={{ marginLeft: LAYOUT.sidebarWidth }}
            >
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    <NeuralConsole /> {/* Changed from NeuralPalette */}
                    <AudioFeedback />
                    <TacticalHUD />
                    <DeadManSwitch />
                    {children}
                    <AuditLog />
                    <InvestorTrigger />
                </main>
            </div>
        </div>
    );
}
