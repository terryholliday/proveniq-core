"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

const generateOriginsData = (count: number) => {
    const relationships = ["Self", "Parent", "Grandparent", "Great-Grandparent", "Sibling", "Aunt/Uncle", "Cousin"];
    const documentTypes = ["Birth Certificate", "Marriage License", "Census Record", "Military Record", "Immigration Doc", "Death Certificate"];
    
    return Array.from({ length: count }).map((_, i) => ({
        id: `PERSON-${1000 + i}`,
        name: `${["John", "Mary", "William", "Elizabeth", "James", "Sarah"][i % 6]} ${["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis"][i % 6]}`,
        relationship: relationships[i % relationships.length],
        birthYear: 1850 + Math.floor(i * 1.5),
        location: ["New York, NY", "Boston, MA", "Philadelphia, PA", "Chicago, IL", "Dublin, IE", "London, UK"][i % 6],
        documents: Math.floor(Math.random() * 12) + 1,
        verified: Math.random() > 0.3 ? "VERIFIED" : "PENDING",
    }));
};

export default function OriginsPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "origins");
    const rowData = useMemo(() => generateOriginsData(200), []);

    const colDefs: ColDef[] = [
        { field: "id", headerName: "Person ID", pinned: "left", width: 120, cellRenderer: (params: any) => <span className="text-purple-400 font-bold">{params.value}</span> },
        { field: "name", headerName: "Full Name", flex: 1, cellStyle: { color: '#f8fafc', fontWeight: 'bold' } },
        { field: "relationship", headerName: "Relationship" },
        { field: "birthYear", headerName: "Birth Year", width: 110 },
        { field: "location", headerName: "Origin Location" },
        { field: "documents", headerName: "Documents", width: 110, cellStyle: { textAlign: 'center' } },
        {
            field: "verified", headerName: "Status", width: 120, cellRenderer: (params: any) => (
                <span className={`flex items-center gap-2 font-bold text-[10px] ${params.value === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${params.value === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
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
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Family Heritage Archive</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>GENERATIONS: <span className="text-purple-400">7</span></div>
                    <div>RECORDS: <span className="text-emerald-500">SYNCED</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
