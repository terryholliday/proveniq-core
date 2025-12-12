"use client";

import React, { useState, useEffect } from "react";
// React-Grid-Layout imports
import RGL, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { WIDGET_REGISTRY, WidgetID } from "@/lib/nexus/registry";
import { NexusWrapper } from "@/components/nexus/NexusWrapper";

const ResponsiveGridLayout = WidthProvider(RGL);

// Initial Layout Configuration
const INITIAL_LAYOUT: Layout[] = [
    { i: 'YIELD_CURVE', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'ORDER_DEPTH', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'AUDIT_LOG', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
    // A couple placeholder items
    { i: 'ASSET_FEED', x: 4, y: 4, w: 4, h: 3 },
    { i: 'LEDGER_STREAM', x: 8, y: 4, w: 4, h: 3 }
];

export function WorkspaceGrid() {
    const [layout, setLayout] = useState<Layout[]>(INITIAL_LAYOUT);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Layout Change Handler
    const onLayoutChange = (newLayout: Layout[]) => {
        setLayout(newLayout);
        // Persist to local storage or DB here
        console.log("Layout Updated:", newLayout);
    };

    if (!mounted) return null;

    return (
        <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={60}
            width={1200} // WidthProvider usually overrides this, but good default
            draggableHandle=".nexus-drag-handle"
            onLayoutChange={onLayoutChange}
            margin={[16, 16]}
        >
            {layout.map((item) => {
                const widgetDef = WIDGET_REGISTRY[item.i as WidgetID];

                // If not in registry, skip or show error
                if (!widgetDef) return (
                    <div key={item.i} className="bg-red-500/20 text-red-500 p-2 font-mono text-xs border border-red-500">
                        UNKNOWN_MODULE::{item.i}
                    </div>
                );

                const Component = widgetDef.component;

                return (
                    <div key={item.i}>
                        <NexusWrapper title={widgetDef.label}>
                            <Component />
                        </NexusWrapper>
                    </div>
                );
            })}
        </ResponsiveGridLayout>
    );
}
