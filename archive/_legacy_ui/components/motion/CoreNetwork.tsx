"use client";

import { useEffect, useState, useCallback, useReducer } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EASE_HEAVY } from "@/lib/physics";
import { Smartphone, HardDrive, BookOpen, Landmark, Cpu } from "lucide-react";

const MAX_PACKETS = 12;

type NetworkState = "Idle" | "Processing" | "Verified";

interface Packet {
  id: string;
  fromNode: string;
  toNode: string;
  progress: number;
}

interface NetworkNode {
  id: string;
  label: string;
  icon: typeof Cpu;
  x: number;
  y: number;
  side: "input" | "center" | "output";
}

const NODES: NetworkNode[] = [
  { id: "phone", label: "Phone", icon: Smartphone, x: 60, y: 100, side: "input" },
  { id: "hardware", label: "Hardware", icon: HardDrive, x: 60, y: 220, side: "input" },
  { id: "core", label: "Core", icon: Cpu, x: 250, y: 160, side: "center" },
  { id: "ledger", label: "Ledger", icon: BookOpen, x: 440, y: 100, side: "output" },
  { id: "bank", label: "Bank", icon: Landmark, x: 440, y: 220, side: "output" },
];

const STATE_COLORS: Record<NetworkState, string> = {
  Idle: "rgb(100, 116, 139)",
  Processing: "rgb(245, 158, 11)",
  Verified: "rgb(16, 185, 129)",
};

type PacketAction =
  | { type: "ADD_PACKET"; packet: Packet }
  | { type: "REMOVE_PACKET"; id: string }
  | { type: "CLEAR_ALL" };

function packetReducer(state: Packet[], action: PacketAction): Packet[] {
  switch (action.type) {
    case "ADD_PACKET":
      if (state.length >= MAX_PACKETS) {
        return [...state.slice(1), action.packet];
      }
      return [...state, action.packet];
    case "REMOVE_PACKET":
      return state.filter((p) => p.id !== action.id);
    case "CLEAR_ALL":
      return [];
    default:
      return state;
  }
}

interface CoreNetworkProps {
  className?: string;
  autoAnimate?: boolean;
}

export function CoreNetwork({ className = "", autoAnimate = true }: CoreNetworkProps) {
  const prefersReducedMotion = useReducedMotion();
  const [networkState, setNetworkState] = useState<NetworkState>("Idle");
  const [packets, dispatch] = useReducer(packetReducer, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createPacket = useCallback(
    (fromNode: string, toNode: string) => {
      if (prefersReducedMotion) return;

      const packet: Packet = {
        id: `${fromNode}-${toNode}-${Date.now()}-${Math.random()}`,
        fromNode,
        toNode,
        progress: 0,
      };
      dispatch({ type: "ADD_PACKET", packet });
    },
    [prefersReducedMotion]
  );

  const removePacket = useCallback((id: string) => {
    dispatch({ type: "REMOVE_PACKET", id });
  }, []);

  useEffect(() => {
    if (!autoAnimate || prefersReducedMotion || !mounted) return;

    const runCycle = () => {
      setNetworkState("Processing");
      createPacket("phone", "core");

      setTimeout(() => {
        createPacket("hardware", "core");
      }, 400);

      setTimeout(() => {
        setNetworkState("Verified");
        createPacket("core", "ledger");
        createPacket("core", "bank");
      }, 1500);

      setTimeout(() => {
        setNetworkState("Idle");
      }, 3000);
    };

    runCycle();
    const interval = setInterval(runCycle, 4000);

    return () => clearInterval(interval);
  }, [autoAnimate, prefersReducedMotion, mounted, createPacket]);

  const getNodeById = (id: string) => NODES.find((n) => n.id === id);

  if (!mounted) {
    return (
      <div className={`relative ${className}`} style={{ width: 500, height: 320 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: 500, height: 320 }}>
      <svg
        viewBox="0 0 500 320"
        className="w-full h-full"
        aria-label="Core network visualization showing data flow"
      >
        <defs>
          <filter id="network-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {NODES.filter((n) => n.side !== "center").map((node) => {
          const core = getNodeById("core")!;
          return (
            <line
              key={`line-${node.id}`}
              x1={node.x}
              y1={node.y}
              x2={core.x}
              y2={core.y}
              stroke="rgb(51, 65, 85)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          );
        })}

        {NODES.map((node) => {
          const Icon = node.icon;
          const isCore = node.id === "core";
          const size = isCore ? 56 : 40;

          return (
            <g key={node.id}>
              {isCore ? (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={size / 2 + 8}
                  fill="none"
                  stroke={STATE_COLORS[networkState]}
                  strokeWidth="2"
                  filter="url(#network-glow)"
                  animate={{
                    opacity: networkState === "Processing" ? [0.5, 1, 0.5] : 1,
                    scale: networkState === "Verified" ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: networkState === "Processing" ? 0.8 : 0.3,
                    repeat: networkState === "Processing" ? Infinity : 0,
                    ease: EASE_HEAVY,
                  }}
                />
              ) : null}

              <circle
                cx={node.x}
                cy={node.y}
                r={size / 2}
                className={isCore ? "fill-slate-800" : "fill-slate-900"}
                stroke={isCore ? STATE_COLORS[networkState] : "rgb(51, 65, 85)"}
                strokeWidth="2"
              />

              <foreignObject
                x={node.x - 10}
                y={node.y - 10}
                width="20"
                height="20"
              >
                <div className="flex items-center justify-center w-full h-full">
                  <Icon
                    className={`w-4 h-4 ${
                      isCore ? "text-proveniq-accent" : "text-slate-400"
                    }`}
                  />
                </div>
              </foreignObject>

              <text
                x={node.x}
                y={node.y + size / 2 + 16}
                textAnchor="middle"
                className="fill-slate-400 text-[11px] font-medium"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        <AnimatePresence>
          {packets.slice(0, MAX_PACKETS).map((packet) => {
            const fromNode = getNodeById(packet.fromNode);
            const toNode = getNodeById(packet.toNode);
            if (!fromNode || !toNode) return null;

            return (
              <motion.circle
                key={packet.id}
                r="5"
                className="fill-proveniq-success"
                filter="url(#network-glow)"
                initial={{ cx: fromNode.x, cy: fromNode.y, opacity: 0, scale: 0 }}
                animate={{ cx: toNode.x, cy: toNode.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 1.2,
                  ease: EASE_HEAVY,
                }}
                onAnimationComplete={() => removePacket(packet.id)}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div
          className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider"
          style={{
            backgroundColor: `${STATE_COLORS[networkState]}20`,
            color: STATE_COLORS[networkState],
            border: `1px solid ${STATE_COLORS[networkState]}40`,
          }}
        >
          {networkState}
        </div>
      </div>
    </div>
  );
}
