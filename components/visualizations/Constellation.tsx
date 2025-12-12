'use client';
import dynamic from 'next/dynamic';
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
export const ConstellationView = ({ data }: { data: any }) => <div className="h-full w-full bg-slate-950"><ForceGraph3D graphData={data} backgroundColor="rgba(0,0,0,0)" nodeColor="color" /></div>;
