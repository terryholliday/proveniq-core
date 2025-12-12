"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

// Mock Data Generator
const generateLedgerData = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        hash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        block: 19400000 + i,
        assetRef: `ASSET-${2400 + i}`,
        validator: `NODE-${Math.floor(Math.random() * 12) + 1}`,
        integrity: Math.random() > 0.02 ? "VALID" : "FLAGGED",
        latency: `${Math.floor(Math.random() * 40) + 10}ms`,
    }));
};

export default function LedgerPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "ledger");
    const rowData = useMemo(() => generateLedgerData(1000), []);

    const colDefs: ColDef[] = [
        { field: "block", headerName: "Block Height", width: 120, sort: 'desc', cellStyle: { color: '#f8fafc', fontWeight: 'bold' } },
        { field: "hash", headerName: "Merkle Root", flex: 2, cellRenderer: (params: any) => <span className="font-mono text-xs opacity-70">{params.value}</span> },
        { field: "assetRef", headerName: "Asset Reference", cellStyle: { color: '#38bdf8' } },
        { field: "validator", headerName: "Validator Node" },
        {
            field: "integrity", headerName: "Status", width: 130, cellRenderer: (params: any) => (
                <span className={`flex items-center gap-2 font-bold text-[10px] ${params.value === 'VALID' ? 'text-emerald-500' : 'text-red-500 animate-pulse'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${params.value === 'VALID' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {params.value}
                </span>
            )
        },
        { field: "latency", headerName: "Latency", width: 100, cellStyle: { fontFamily: 'monospace' } }
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Verification Stream</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span>SYNCING</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
