"use client";

import React from 'react';
import { PROVENIQ_DNA } from "@/lib/config";

interface DataMatrixProps {
    rowData: any[];
    columnDefs: any[];
    height?: string | number;
}

export function DataMatrix({ rowData, columnDefs, height = 500 }: DataMatrixProps) {
    // Simplified table implementation to avoid ag-grid webpack issues
    return (
        <div
            className="w-full overflow-auto border border-slate-800 rounded-lg"
            style={{ height }}
        >
            <table className="w-full text-sm">
                <thead className="bg-slate-950 sticky top-0">
                    <tr>
                        {columnDefs.map((col: any, i: number) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800"
                            >
                                {col.headerName || col.field}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-slate-900/50">
                    {rowData.length === 0 ? (
                        <tr>
                            <td colSpan={columnDefs.length} className="px-4 py-8 text-center text-slate-500 font-mono">
                                NO_SIGNAL_DETECTED
                            </td>
                        </tr>
                    ) : (
                        rowData.map((row: any, rowIndex: number) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                                {columnDefs.map((col: any, colIndex: number) => (
                                    <td
                                        key={colIndex}
                                        className="px-4 py-3 text-slate-400"
                                        style={{ fontFamily: PROVENIQ_DNA.theme.fonts.data }}
                                    >
                                        {row[col.field] ?? '-'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
