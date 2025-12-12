"use client";

import React from "react";

export function SkeletonWidget({ label }: { label: string }) {
    return (
        <div className="h-full w-full rounded bg-slate-900/50 flex flex-col items-center justify-center border border-dashed border-slate-800 animate-pulse">
            <div className="w-8 h-8 rounded bg-slate-800 mb-2" />
            <span className="font-mono text-xs text-slate-600 uppercase tracking-widest">
                LOADING::{label}
            </span>
        </div>
    );
}
