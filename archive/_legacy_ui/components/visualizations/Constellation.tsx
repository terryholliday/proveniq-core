'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useMemo } from 'react';
import type { ProductModule } from '@/lib/config';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// Color mapping by product type
const TYPE_COLORS: Record<string, string> = {
  Software: '#10b981',      // emerald
  Infrastructure: '#0ea5e9', // sky
  Hardware: '#f59e0b',       // amber
};

// Role-based node sizing (importance weight)
const ROLE_WEIGHTS: Record<string, number> = {
  Orchestrate: 16,  // Core is central
  Finance: 14,
  Ingest: 12,
  Verify: 12,
  Adjudicate: 10,
  Liquidate: 10,
  Secure: 8,
  Track: 8,
};

export interface ConstellationNode {
  id: string;
  label: string;
  color: string;
  val: number;
  type: string;
  role: string;
  routeSlug: string;
  // Runtime properties added by ForceGraph3D
  x?: number;
  y?: number;
  z?: number;
}

export interface ConstellationLink {
  source: string;
  target: string;
  color?: string;
}

export interface ConstellationData {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
}

interface ConstellationViewProps {
  data: ConstellationData;
  onNodeClick?: (node: ConstellationNode) => void;
  enableNavigation?: boolean;
}

export const ConstellationView = ({ 
  data, 
  onNodeClick,
  enableNavigation = true 
}: ConstellationViewProps) => {
  const router = useRouter();
  const fgRef = useRef<any>();

  const handleNodeClick = useCallback((node: ConstellationNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    if (enableNavigation && node.routeSlug) {
      router.push(`/products/${node.routeSlug}`);
    }
    // Focus camera on clicked node
    if (fgRef.current) {
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
      fgRef.current.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
        node,
        1000
      );
    }
  }, [router, onNodeClick, enableNavigation]);

  const nodeThreeObject = useCallback((node: ConstellationNode) => {
    // Using THREE.js sprite for labels - will be created by ForceGraph
    return undefined; // Let ForceGraph handle default spheres, we'll use nodeLabel for hover
  }, []);

  return (
    <div className="h-full w-full bg-slate-950 relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        backgroundColor="rgba(15, 23, 42, 1)"
        nodeColor={(node: any) => node.color}
        nodeVal={(node: any) => node.val || 8}
        nodeLabel={(node: any) => `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid ${node.color};
            padding: 8px 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            color: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          ">
            <div style="font-weight: bold; color: ${node.color}; margin-bottom: 4px;">
              ${node.label || node.id}
            </div>
            <div style="color: #94a3b8; font-size: 10px;">
              ${node.type} · ${node.role}
            </div>
            <div style="color: #64748b; font-size: 9px; margin-top: 4px;">
              Click to navigate →
            </div>
          </div>
        `}
        nodeOpacity={0.95}
        linkColor={() => 'rgba(100, 116, 139, 0.4)'}
        linkWidth={1.5}
        linkOpacity={0.6}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#0ea5e9'}
        onNodeClick={(node: any) => handleNodeClick(node as ConstellationNode)}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
        warmupTicks={50}
        cooldownTicks={100}
      />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs font-mono">
        <div className="text-slate-400 mb-2 uppercase tracking-wider">Node Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS.Software }} />
            <span className="text-slate-300">Software</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS.Infrastructure }} />
            <span className="text-slate-300">Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS.Hardware }} />
            <span className="text-slate-300">Hardware</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility to transform PROVENIQ_DNA products into constellation data
export function buildConstellationFromDNA(products: ProductModule[]): ConstellationData {
  const nodes: ConstellationNode[] = products.map((p) => ({
    id: p.id,
    label: p.label,
    color: TYPE_COLORS[p.type] || '#64748b',
    val: ROLE_WEIGHTS[p.role] || 8,
    type: p.type,
    role: p.role,
    routeSlug: p.routeSlug,
  }));

  // Build links: Core connects to everything, then logical groupings
  const links: ConstellationLink[] = [];
  const coreNode = products.find(p => p.role === 'Orchestrate');
  
  if (coreNode) {
    // Core connects to all other nodes
    products.forEach(p => {
      if (p.id !== coreNode.id) {
        links.push({ source: coreNode.id, target: p.id });
      }
    });
  }

  // Additional logical connections
  const softwareNodes = products.filter(p => p.type === 'Software');
  const hardwareNodes = products.filter(p => p.type === 'Hardware');

  // Chain software nodes (data flow)
  for (let i = 0; i < softwareNodes.length - 1; i++) {
    links.push({ source: softwareNodes[i].id, target: softwareNodes[i + 1].id });
  }

  // Hardware nodes connect to each other
  if (hardwareNodes.length > 1) {
    links.push({ source: hardwareNodes[0].id, target: hardwareNodes[1].id });
  }

  return { nodes, links };
}

export { TYPE_COLORS, ROLE_WEIGHTS };
