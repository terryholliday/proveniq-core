"use client";

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community';
import { PROVENIQ_DNA } from "@/lib/config";
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the grid

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

interface DataMatrixProps {
    rowData: any[];
    columnDefs: ColDef[];
    height?: string | number;
}

export function DataMatrix({ rowData, columnDefs, height = 500 }: DataMatrixProps) {

    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            sortable: true,
            resizable: true,
            cellStyle: { color: '#94a3b8', fontFamily: PROVENIQ_DNA.theme.fonts.data }, // Slate-400
        };
    }, []);

    return (
        <div
            className="ag-theme-quartz-dark w-full"
            style={{ height }}
        >
            <style jsx global>{`
                .ag-theme-quartz-dark {
                    /* Customizing Quartz Theme to match Proveniq Slate-950 */
                    --ag-background-color: #0f172a; /* slate-900 */
                    --ag-header-background-color: #020617; /* slate-950 */
                    --ag-row-hover-color: #1e293b; /* slate-800 */
                    --ag-odd-row-background-color: #0f172a;
                    --ag-border-color: #1e293b;
                    --ag-header-foreground-color: #e2e8f0; /* slate-200 */
                    --ag-foreground-color: #94a3b8; /* slate-400 */
                    --ag-font-family: ${PROVENIQ_DNA.theme.fonts.data};
                    --ag-font-size: 13px;
                }
                .ag-header-cell-label {
                   font-weight: 600;
                   letter-spacing: 0.05em;
                   text-transform: uppercase;
                   font-size: 11px;
                   color: #64748b; /* slate-500 */
                }
            `}</style>

            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                animateRows={true}
                overlayNoRowsTemplate='<span class="text-slate-500 font-mono">NO_SIGNAL_DETECTED</span>'
            />
        </div>
    );
}
