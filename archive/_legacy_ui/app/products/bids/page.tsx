"use client";

import React, { useMemo } from "react";
import { DataMatrix } from "@/components/grid/DataMatrix";
import { PROVENIQ_DNA } from "@/lib/config";
import { ColDef } from "ag-grid-community";

const generateBidsData = (count: number) => {
    const categories = ["Fine Art", "Jewelry", "Collectibles", "Electronics", "Vehicles", "Real Estate"];
    const conditions = ["Excellent", "Good", "Fair", "As-Is"];
    
    return Array.from({ length: count }).map((_, i) => ({
        lotId: `LOT-${String(i + 1).padStart(4, '0')}`,
        title: `${["Vintage", "Antique", "Modern", "Classic", "Rare", "Estate"][i % 6]} ${["Watch", "Painting", "Ring", "Camera", "Coin", "Vase"][i % 6]}`,
        category: categories[i % categories.length],
        condition: conditions[i % conditions.length],
        startBid: `$${(Math.random() * 5000 + 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        currentBid: `$${(Math.random() * 10000 + 500).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        bids: Math.floor(Math.random() * 25),
        timeLeft: `${Math.floor(Math.random() * 23 + 1)}h ${Math.floor(Math.random() * 59)}m`,
        verified: Math.random() > 0.2,
    }));
};

export default function BidsPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "bids");
    const rowData = useMemo(() => generateBidsData(300), []);

    const colDefs: ColDef[] = [
        { field: "lotId", headerName: "Lot #", pinned: "left", width: 100, cellRenderer: (params: any) => <span className="text-amber-500 font-bold">{params.value}</span> },
        { field: "title", headerName: "Item Title", flex: 1, cellStyle: { color: '#f8fafc', fontWeight: 'bold' } },
        { field: "category", headerName: "Category" },
        { field: "condition", headerName: "Condition", width: 100 },
        { field: "startBid", headerName: "Start Bid", width: 110, cellStyle: { fontFamily: 'monospace' } },
        { field: "currentBid", headerName: "Current Bid", width: 120, cellStyle: { fontFamily: 'monospace', color: '#10b981', fontWeight: 'bold' } },
        { field: "bids", headerName: "# Bids", width: 80, cellStyle: { textAlign: 'center' } },
        { field: "timeLeft", headerName: "Time Left", width: 100, cellRenderer: (params: any) => (
            <span className="text-orange-400 font-mono text-xs">{params.value}</span>
        )},
        {
            field: "verified", headerName: "Verified", width: 90, cellRenderer: (params: any) => (
                <span className={`flex items-center justify-center ${params.value ? 'text-emerald-500' : 'text-slate-600'}`}>
                    {params.value ? '✓' : '—'}
                </span>
            )
        },
    ];

    return (
        <div className="h-full flex flex-col p-6 bg-slate-950 space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{product?.label}</h1>
                    <p className="text-slate-400 font-mono text-sm max-w-xl">{product?.role} Layer // Verified Asset Marketplace</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <div>LIVE AUCTIONS: <span className="text-amber-500">47</span></div>
                    <div>TOTAL VALUE: <span className="text-emerald-500">$2.4M</span></div>
                </div>
            </header>

            <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
                <DataMatrix rowData={rowData} columnDefs={colDefs} height="100%" />
            </div>
        </div>
    );
}
