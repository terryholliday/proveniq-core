"use client";

import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { PROVENIQ_DNA } from "@/lib/config";

const data = [
    { maturity: "1M", yield: 4.2 },
    { maturity: "3M", yield: 4.5 },
    { maturity: "6M", yield: 4.8 },
    { maturity: "1Y", yield: 5.1 },
    { maturity: "2Y", yield: 4.9 },
    { maturity: "5Y", yield: 4.6 },
    { maturity: "10Y", yield: 4.4 },
    { maturity: "30Y", yield: 4.2 },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
                <p className="text-slate-300 font-mono text-xs mb-1">MATURITY: <span className="text-white font-bold">{label}</span></p>
                <p className="text-emerald-500 font-mono text-sm font-bold">
                    {`YIELD: ${payload[0].value}%`}
                </p>
            </div>
        );
    }
    return null;
};

export function YieldCurve() {
    return (
        <div className="w-full h-full min-h-[300px] p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Projected Yield Curve (US Treasuries)</h3>
                <span className="text-[10px] font-mono text-emerald-500 animate-pulse">LIVE PROJECTING...</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                        dataKey="maturity"
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        domain={[3, 6]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="yield"
                        stroke="#10b981" // emerald-500
                        fill="#10b981"
                        fillOpacity={0.1}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
