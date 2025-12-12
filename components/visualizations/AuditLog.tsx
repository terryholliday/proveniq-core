"use client";

import React, { useRef, useEffect } from "react";
import { useSystemStore } from "@/lib/store";

export function AuditLog() {
    const auditLog = useSystemStore((state) => state.auditLog);
    // Just show last 5 entries to save space in UI, or full list in a modal
    // For now, let's make it a small readout component

    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <div className="bg-black/90 border border-slate-800 rounded p-2 text-[10px] font-mono text-emerald-500/80 w-64">
                <div className="border-b border-slate-800 mb-1 pb-1 flex justify-between">
                    <span>SENTINEL::AUDIT_STREAM</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-0.5 max-h-32 overflow-hidden flex flex-col-reverse">
                    {auditLog.slice(0, 5).map((record) => (
                        <div key={record.id} className="truncate">
                            <span className="text-slate-500">[{record.timestamp.split('T')[1].split('.')[0]}]</span> {record.action}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
