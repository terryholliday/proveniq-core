"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

const generateClaimsData = (count: number) => {
    const claimTypes = ["Fire", "Theft", "Water Damage", "Liability", "Wind/Hail", "Vehicle"];
    const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    
    return Array.from({ length: count }).map((_, i) => ({
        claimId: `CLM-${2024}${String(i).padStart(5, '0')}`,
        policyholder: `${["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis"][i % 6]}, ${["J.", "M.", "R.", "S.", "A.", "T."][i % 6]}`,
        type: claimTypes[i % claimTypes.length],
        amount: `$${(Math.random() * 50000 + 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        riskScore: Math.floor(Math.random() * 100),
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        aiConfidence: `${Math.floor(Math.random() * 30 + 70)}%`,
        status: ["In Review", "AI Analysis", "Adjuster Queue", "Approved", "Flagged"][i % 5],
    }));
};

export default function ClaimsIQPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "claims-iq");
    const rowData = useMemo(() => generateClaimsData(500), []);

    const colDefs: ColDef[] = [
        { field: "claimId", headerName: "Claim ID", pinned: "left", width: 140, cellRenderer: (params: any) => <span className="text-sky-500 font-bold">{params.value}</span> },
        { field: "policyholder", headerName: "Policyholder", flex: 1 },
        { field: "type", headerName: "Claim Type" },
        { field: "amount", headerName: "Amount", type: "rightAligned", cellStyle: { color: '#10b981' } },
        { field: "riskScore", headerName: "Risk Score", width: 110, cellRenderer: (params: any) => (
            <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${params.value > 70 ? 'bg-red-500' : params.value > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${params.value}%` }} />
                </div>
                <span className="text-xs">{params.value}</span>
            </div>
        )},
        {
            field: "riskLevel", headerName: "Risk Level", width: 110, cellRenderer: (params: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    params.value === 'CRITICAL' ? 'border-red-500/50 text-red-500 bg-red-500/10 animate-pulse' :
                    params.value === 'HIGH' ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' :
                    params.value === 'MEDIUM' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                    'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                }`}>
                    {params.value}
                </span>
            )
        },
        { field: "aiConfidence", headerName: "AI Conf.", width: 100, cellStyle: { fontFamily: 'monospace', color: '#38bdf8' } },
        { field: "status", headerName: "Status" },
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // AI-Powered Claims Intelligence</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>MODEL: <span className="text-sky-500">GEMINI-2.5</span></div>
                    <div>QUEUE: <span className="text-amber-500">142 PENDING</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
