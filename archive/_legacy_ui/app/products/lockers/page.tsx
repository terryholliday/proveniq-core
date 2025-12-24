"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

const generateLockerData = (count: number) => {
    const locations = ["NYC Vault A", "NYC Vault B", "LA Secure", "Chicago Prime", "Miami Safe", "Dallas Hub"];
    const sizes = ["Small", "Medium", "Large", "XL", "Climate-Ctrl"];
    
    return Array.from({ length: count }).map((_, i) => ({
        lockerId: `LKR-${String(i + 1).padStart(5, '0')}`,
        location: locations[i % locations.length],
        size: sizes[i % sizes.length],
        assetRef: Math.random() > 0.3 ? `ASSET-${2400 + i}` : "—",
        status: ["Occupied", "Available", "Reserved", "Maintenance"][i % 4],
        temp: `${Math.floor(Math.random() * 10 + 65)}°F`,
        humidity: `${Math.floor(Math.random() * 20 + 40)}%`,
        lastAccess: `${Math.floor(Math.random() * 30) + 1}d ago`,
        tamperSeal: Math.random() > 0.05 ? "INTACT" : "ALERT",
    }));
};

export default function LockersPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "lockers");
    const rowData = useMemo(() => generateLockerData(150), []);

    const colDefs: ColDef[] = [
        { field: "lockerId", headerName: "Locker ID", pinned: "left", width: 120, cellRenderer: (params: any) => <span className="text-cyan-400 font-bold">{params.value}</span> },
        { field: "location", headerName: "Facility" },
        { field: "size", headerName: "Size", width: 110 },
        { field: "assetRef", headerName: "Asset Ref", cellStyle: { color: '#38bdf8' } },
        {
            field: "status", headerName: "Status", width: 120, cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    params.value === 'Occupied' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' :
                    params.value === 'Available' ? 'border-slate-500/50 text-slate-400 bg-slate-500/10' :
                    params.value === 'Reserved' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                    'border-red-500/50 text-red-500 bg-red-500/10'
                }`}>
                    {params.value}
                </span>
            )
        },
        { field: "temp", headerName: "Temp", width: 80, cellStyle: { fontFamily: 'monospace' } },
        { field: "humidity", headerName: "Humid.", width: 80, cellStyle: { fontFamily: 'monospace' } },
        { field: "lastAccess", headerName: "Last Access", width: 100 },
        {
            field: "tamperSeal", headerName: "Seal", width: 90, cellRenderer: (params: any) => (
                <span className={`font-bold text-[10px] ${params.value === 'INTACT' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                    {params.value}
                </span>
            )
        },
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Physical Custody Network</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>FACILITIES: <span className="text-cyan-400">6</span></div>
                    <div>CAPACITY: <span className="text-emerald-500">78%</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
