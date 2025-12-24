"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

// Mock Data Generator
const generateAssetData = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `ASSET-${2400 + i}`,
        type: ["Real Estate", "Fine Art", "Commodity", "Intellectual Property"][i % 4],
        value: (Math.random() * 1000000).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        origin: ["New York, NY", "London, UK", "Geneva, CH", "Singapore, SG"][i % 4],
        status: ["Pending", "Ingesting", "Scanning", "Queued"][i % 4],
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    }));
};

export default function HomePage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "home");
    const rowData = useMemo(() => generateAssetData(500), []);

    const colDefs: ColDef[] = [
        { field: "id", headerName: "Asset ID", pinned: "left", width: 120, cellRenderer: (params: any) => <span className="text-sky-500 font-bold">{params.value}</span> },
        { field: "type", headerName: "Asset Class" },
        { field: "value", headerName: "Est. Valuation", type: "rightAligned", cellStyle: { color: '#10b981' } }, // emerald-500
        { field: "origin", headerName: "Origin Jurisdiction" },
        {
            field: "status", headerName: "Ingest State", cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${params.value === 'Ingesting' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                        params.value === 'Scanning' ? 'border-sky-500/50 text-sky-500 bg-sky-500/10 animate-pulse' :
                            'border-slate-700 text-slate-500'
                    }`}>
                    {params.value}
                </span>
            )
        },
        { field: "timestamp", headerName: "Timestamp", width: 200 }
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Live Asset Feed</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>BUFFER: <span className="text-white">512MB</span></div>
                    <div>LINK: <span className="text-emerald-500">STABLE</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
