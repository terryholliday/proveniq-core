"use client";

import React from "react";
import { PROVENIQ_DNA } from "@/lib/config";
import { WorkspaceGrid } from "@/components/dashboard/WorkspaceGrid";

export default function DashboardPage() {
    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6 overflow-hidden">
            <header className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">NEXUS</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">Unified Workspace // Federated Glass Pane</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>LAYOUT: <span className="text-sky-500">CUSTOM</span></div>
                    <div>MODULES: <span className="text-white">5 Active</span></div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                <WorkspaceGrid />
            </div>
        </div>
    );
}
