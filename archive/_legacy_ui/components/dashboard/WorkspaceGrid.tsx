"use client";

import React, { useState, useEffect } from "react";
import { WIDGET_REGISTRY, WidgetID } from "@/lib/nexus/registry";
import { NexusWrapper } from "@/components/nexus/NexusWrapper";

// Define layout item type
interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

// Initial Layout Configuration
const INITIAL_LAYOUT: LayoutItem[] = [
    { i: 'YIELD_CURVE', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'ORDER_DEPTH', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'AUDIT_LOG', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'ASSET_FEED', x: 4, y: 4, w: 4, h: 3 },
    { i: 'LEDGER_STREAM', x: 8, y: 4, w: 4, h: 3 }
];

export function WorkspaceGrid() {
    const [layout] = useState<LayoutItem[]>(INITIAL_LAYOUT);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="grid grid-cols-12 gap-4 p-4">
            {layout.map((item) => {
                const widgetDef = WIDGET_REGISTRY[item.i as WidgetID];

                if (!widgetDef) return (
                    <div 
                        key={item.i} 
                        className="bg-red-500/20 text-red-500 p-2 font-mono text-xs border border-red-500"
                        style={{ gridColumn: `span ${item.w}` }}
                    >
                        UNKNOWN_MODULE::{item.i}
                    </div>
                );

                const Component = widgetDef.component;

                return (
                    <div 
                        key={item.i}
                        style={{ 
                            gridColumn: `span ${item.w}`,
                            minHeight: `${item.h * 60}px`
                        }}
                    >
                        <NexusWrapper title={widgetDef.label}>
                            <Component />
                        </NexusWrapper>
                    </div>
                );
            })}
        </div>
    );
}
