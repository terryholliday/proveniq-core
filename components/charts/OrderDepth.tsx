"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from "recharts";

const data = [
    { price: 104.50, volume: 1200, type: 'ask' },
    { price: 104.25, volume: 3400, type: 'ask' },
    { price: 104.00, volume: 5100, type: 'ask' },
    { price: 103.75, volume: 200, type: 'spread' }, // Spread
    { price: 103.50, volume: 6500, type: 'bid' },
    { price: 103.25, volume: 4200, type: 'bid' },
    { price: 103.00, volume: 1800, type: 'bid' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const type = payload[0].payload.type;
        const color = type === 'ask' ? 'text-red-500' : type === 'bid' ? 'text-emerald-500' : 'text-slate-500';

        return (
            <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                <p className="text-slate-400 font-mono text-[10px]">PRICE: <span className="text-white">{label}</span></p>
                <p className={`${color} font-mono text-xs font-bold`}>
                    VOL: {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export function OrderDepth() {
    return (
        <div className="w-full h-full min-h-[300px] p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Asset Liquidity Depth</h3>
                <span className="text-[10px] font-mono text-sky-500">MARKET_MAKER_V2</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="price"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                        width={50}
                    />
                    <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
                    <ReferenceLine x={0} stroke="#334155" />
                    <Bar dataKey="volume" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.type === 'ask' ? '#ef4444' : entry.type === 'bid' ? '#10b981' : 'transparent'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
