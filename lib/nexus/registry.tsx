"use client";

import dynamic from 'next/dynamic';
import { SkeletonWidget } from '@/components/nexus/SkeletonWidget';
import type { ComponentType } from 'react';

// Define the valid widget IDs (Sync with PROVENIQ_DNA)
export type WidgetID = 'YIELD_CURVE' | 'ORDER_DEPTH' | 'AUDIT_LOG' | 'ASSET_FEED' | 'LEDGER_STREAM' | 'CONSTELLATION';

export interface WidgetDefinition {
    id: WidgetID;
    label: string;
    component: ComponentType<any>;
    defaultDimensions: { w: number; h: number }; // Grid units
    minDimensions: { w: number; h: number };
}

// Lazy load heavy components to reduce initial bundle size
const YieldCurve = dynamic(() => import('@/components/charts/YieldCurve').then(mod => mod.YieldCurve), {
    loading: () => <SkeletonWidget label="Yield Curve" />,
});
const OrderDepth = dynamic(() => import('@/components/charts/OrderDepth').then(mod => mod.OrderDepth), {
    loading: () => <SkeletonWidget label="Order Depth" />,
});
const AuditLogWidget = dynamic(() => import('@/components/visualizations/AuditLog').then(mod => mod.AuditLog), {
    loading: () => <SkeletonWidget label="Audit Log" />,
});
const ConstellationWidget = dynamic(() => import('@/components/visualizations/Constellation').then(mod => mod.Constellation), {
    loading: () => <SkeletonWidget label="Holodeck" />,
});

// The Registry Map
export const WIDGET_REGISTRY: Record<WidgetID, WidgetDefinition> = {
    YIELD_CURVE: {
        id: 'YIELD_CURVE',
        label: 'Treasury Yield Projection',
        component: YieldCurve,
        defaultDimensions: { w: 6, h: 4 },
        minDimensions: { w: 4, h: 3 },
    },
    ORDER_DEPTH: {
        id: 'ORDER_DEPTH',
        label: 'L2 Market Depth',
        component: OrderDepth,
        defaultDimensions: { w: 6, h: 4 },
        minDimensions: { w: 3, h: 2 },
    },
    AUDIT_LOG: {
        id: 'AUDIT_LOG',
        label: 'Sentinel Audit Stream',
        component: AuditLogWidget,
        defaultDimensions: { w: 4, h: 3 },
        minDimensions: { w: 3, h: 2 },
    },
    ASSET_FEED: {
        id: "ASSET_FEED",
        label: "Live Asset Intest",
        component: () => <div className="p-4 text-xs font-mono text-slate-500">DATA_MATRIX_FEED_V1 [PLACEHOLDER]</div>,
        defaultDimensions: { w: 6, h: 6 },
        minDimensions: { w: 4, h: 4 }
    },
    LEDGER_STREAM: {
        id: "LEDGER_STREAM",
        label: "Verification Ledger",
        component: () => <div className="p-4 text-xs font-mono text-slate-500">BLOCKCHAIN_NODE_SYNC [PLACEHOLDER]</div>,
        defaultDimensions: { w: 6, h: 6 },
        minDimensions: { w: 4, h: 4 }
    },
    CONSTELLATION: {
        id: "CONSTELLATION",
        label: "Risk Topology (Holodeck)",
        component: ConstellationWidget,
        defaultDimensions: { w: 12, h: 8 }, // Large default for "Boardroom" feel
        minDimensions: { w: 6, h: 6 }
    }
};
