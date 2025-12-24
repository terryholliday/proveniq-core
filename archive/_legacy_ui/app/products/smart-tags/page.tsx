"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

const generateTagData = (count: number) => {
    const tagTypes = ["NFC", "RFID", "BLE", "GPS", "Hybrid"];
    const assetTypes = ["Fine Art", "Jewelry", "Document", "Equipment", "Vehicle", "Collectible"];
    
    return Array.from({ length: count }).map((_, i) => ({
        tagId: `TAG-${String(i + 1).padStart(6, '0')}`,
        type: tagTypes[i % tagTypes.length],
        assetRef: `ASSET-${2400 + i}`,
        assetType: assetTypes[i % assetTypes.length],
        lastPing: `${Math.floor(Math.random() * 60)}m ago`,
        battery: `${Math.floor(Math.random() * 60 + 40)}%`,
        signal: ["Strong", "Good", "Weak", "Strong", "Good"][i % 5],
        location: `${(Math.random() * 180 - 90).toFixed(4)}, ${(Math.random() * 360 - 180).toFixed(4)}`,
        status: Math.random() > 0.1 ? "ACTIVE" : "OFFLINE",
    }));
};

export default function SmartTagsPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "smart-tags");
    const rowData = useMemo(() => generateTagData(400), []);

    const colDefs: ColDef[] = [
        { field: "tagId", headerName: "Tag ID", pinned: "left", width: 130, cellRenderer: (params: any) => <span className="text-pink-400 font-bold">{params.value}</span> },
        { field: "type", headerName: "Type", width: 80 },
        { field: "assetRef", headerName: "Asset Ref", cellStyle: { color: '#38bdf8' } },
        { field: "assetType", headerName: "Asset Type" },
        { field: "lastPing", headerName: "Last Ping", width: 100, cellStyle: { fontFamily: 'monospace' } },
        { field: "battery", headerName: "Battery", width: 90, cellRenderer: (params: any) => {
            const val = parseInt(params.value);
            return (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${val > 60 ? 'bg-emerald-500' : val > 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: params.value }} />
                    </div>
                    <span className="text-xs">{params.value}</span>
                </div>
            );
        }},
        {
            field: "signal", headerName: "Signal", width: 90, cellRenderer: (params: any) => (
                <span className={`text-xs ${
                    params.value === 'Strong' ? 'text-emerald-500' :
                    params.value === 'Good' ? 'text-sky-500' : 'text-amber-500'
                }`}>
                    {params.value}
                </span>
            )
        },
        { field: "location", headerName: "GPS", width: 180, cellStyle: { fontFamily: 'monospace', fontSize: '10px' } },
        {
            field: "status", headerName: "Status", width: 90, cellRenderer: (params: any) => (
                <span className={`flex items-center gap-2 font-bold text-[10px] ${params.value === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${params.value === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
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
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // IoT Chain-of-Custody</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>DEPLOYED: <span className="text-pink-400">2,847</span></div>
                    <div>ONLINE: <span className="text-emerald-500">98.2%</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
