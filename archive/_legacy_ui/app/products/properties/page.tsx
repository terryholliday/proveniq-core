"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

// Mock Data Generator for Properties
const generateInspectionData = (count: number) => {
    const types = ["MOVE_IN", "MOVE_OUT", "PERIODIC", "PRE_STAY", "POST_STAY"];
    const statuses = ["DRAFT", "SUBMITTED", "SIGNED", "REVIEWED"];
    const occupancyModels = ["long_term_residential", "commercial_lease", "short_term_rental"];
    
    return Array.from({ length: count }).map((_, i) => ({
        id: `INS-${100000 + i}`,
        property: `${["Sunset Apartments", "Harbor View", "Downtown Lofts", "Oak Grove", "Marina Bay"][i % 5]} #${100 + (i % 50)}`,
        type: types[i % types.length],
        occupancy: occupancyModels[i % occupancyModels.length],
        status: statuses[i % statuses.length],
        evidenceCount: Math.floor(Math.random() * 50) + 5,
        contentHash: `sha256:${Math.random().toString(36).substring(2, 10)}...`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    }));
};

export default function PropertiesPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "properties");
    const rowData = useMemo(() => generateInspectionData(500), []);

    const colDefs: ColDef[] = [
        { 
            field: "id", 
            headerName: "Inspection ID", 
            pinned: "left", 
            width: 130, 
            cellRenderer: (params: any) => <span className="text-emerald-500 font-bold">{params.value}</span> 
        },
        { field: "property", headerName: "Property / Unit", width: 200 },
        { 
            field: "type", 
            headerName: "Type",
            width: 120,
            cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    params.value === 'MOVE_IN' ? 'border-sky-500/50 text-sky-500 bg-sky-500/10' :
                    params.value === 'MOVE_OUT' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                    params.value === 'PRE_STAY' ? 'border-teal-500/50 text-teal-500 bg-teal-500/10' :
                    params.value === 'POST_STAY' ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' :
                    'border-slate-700 text-slate-500'
                }`}>
                    {params.value}
                </span>
            )
        },
        { 
            field: "occupancy", 
            headerName: "Occupancy Model",
            width: 180,
            cellRenderer: (params: any) => (
                <span className="text-slate-400 text-xs font-mono">
                    {params.value}
                </span>
            )
        },
        {
            field: "status", 
            headerName: "Status", 
            width: 110,
            cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    params.value === 'SIGNED' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' :
                    params.value === 'SUBMITTED' ? 'border-sky-500/50 text-sky-500 bg-sky-500/10' :
                    params.value === 'REVIEWED' ? 'border-purple-500/50 text-purple-500 bg-purple-500/10' :
                    'border-slate-700 text-slate-500'
                }`}>
                    {params.value}
                </span>
            )
        },
        { 
            field: "evidenceCount", 
            headerName: "Evidence", 
            width: 100,
            type: "rightAligned",
            cellRenderer: (params: any) => (
                <span className="text-emerald-400 font-mono">{params.value}</span>
            )
        },
        { 
            field: "contentHash", 
            headerName: "SHA-256 Hash",
            width: 160,
            cellRenderer: (params: any) => (
                <span className="text-slate-500 font-mono text-xs">{params.value}</span>
            )
        },
        { field: "timestamp", headerName: "Timestamp", width: 200 }
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Immutable Inspection Records</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>HASH_ALG: <span className="text-emerald-500">SHA-256</span></div>
                    <div>CANONICAL: <span className="text-emerald-500">ACTIVE</span></div>
                    <div>CUSTODY: <span className="text-white">IMMUTABLE</span></div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-mono uppercase">Total Inspections</p>
                    <p className="text-2xl font-bold text-white mt-1">12,847</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-mono uppercase">Evidence Files</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">284,192</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-mono uppercase">STR Claims</p>
                    <p className="text-2xl font-bold text-amber-500 mt-1">1,247</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-mono uppercase">Deposit Disputes</p>
                    <p className="text-2xl font-bold text-sky-500 mt-1">3,891</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-mono uppercase">Win Rate</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">94.2%</p>
                </div>
            </div>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
