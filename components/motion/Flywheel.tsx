"use client";

import { useEffect, useState } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { PROVENIQ_DNA } from "@/lib/config";
import {
  FLYWHEEL_RADIUS,
  NODE_COUNT,
  ROTATION_DURATION,
  PACKET_STAGGER_DELAY,
  EASE_HEAVY,
} from "@/lib/physics";

interface FlywheelProps {
  className?: string;
  showPackets?: boolean;
  autoRotate?: boolean;
}

interface NodePosition {
  x: number;
  y: number;
  angle: number;
}

function calculateNodePositions(count: number, radius: number): NodePosition[] {
  const positions: NodePosition[] = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i - Math.PI / 2;
    positions.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle: (angle * 180) / Math.PI,
    });
  }

  return positions;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

const packetVariants: Variants = {
  initial: { offsetDistance: "0%" },
  animate: {
    offsetDistance: "100%",
    transition: {
      duration: 2,
      ease: EASE_HEAVY,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const orbitProducts = PROVENIQ_DNA.products.filter((p) => p.id !== "core").slice(0, NODE_COUNT);

export function Flywheel({
  className = "",
  showPackets = true,
  autoRotate = true,
}: FlywheelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nodePositions = calculateNodePositions(NODE_COUNT, FLYWHEEL_RADIUS);
  const shouldRotate = autoRotate && !prefersReducedMotion;
  const shouldAnimatePackets = showPackets && !prefersReducedMotion;

  const viewBoxSize = FLYWHEEL_RADIUS * 2 + 100;
  const center = viewBoxSize / 2;

  if (!mounted) {
    return (
      <div className={`relative ${className}`} style={{ width: viewBoxSize, height: viewBoxSize }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-proveniq-accent/20" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: viewBoxSize, height: viewBoxSize }}>
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        aria-label="Proveniq ecosystem flywheel visualization"
      >
        <defs>
          {nodePositions.map((pos, i) => (
            <path
              key={`path-${i}`}
              id={`packet-path-${i}`}
              d={`M ${center + pos.x} ${center + pos.y} L ${center} ${center}`}
              fill="none"
            />
          ))}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={shouldRotate ? { rotate: 360 } : undefined}
          transition={
            shouldRotate
              ? {
                  duration: ROTATION_DURATION,
                  repeat: Infinity,
                  ease: "linear",
                }
              : undefined
          }
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          <circle
            cx={center}
            cy={center}
            r={FLYWHEEL_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-800"
            strokeDasharray="4 8"
          />

          <motion.g
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {nodePositions.map((pos, i) => {
              const product = orbitProducts[i];
              if (!product) return null;

              return (
                <motion.g key={product.id} variants={nodeVariants}>
                  <line
                    x1={center}
                    y1={center}
                    x2={center + pos.x}
                    y2={center + pos.y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-800"
                  />

                  <circle
                    cx={center + pos.x}
                    cy={center + pos.y}
                    r="32"
                    className="fill-proveniq-panel stroke-slate-700"
                    strokeWidth="1"
                  />

                  <text
                    x={center + pos.x}
                    y={center + pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-300 text-[10px] font-medium"
                  >
                    {product.label}
                  </text>

                  <text
                    x={center + pos.x}
                    y={center + pos.y + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-500 text-[8px] font-mono"
                  >
                    {product.role}
                  </text>
                </motion.g>
              );
            })}
          </motion.g>
        </motion.g>

        <motion.circle
          cx={center}
          cy={center}
          r="48"
          className="fill-proveniq-panel"
          filter="url(#glow)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{ duration: 0.5, ease: EASE_HEAVY }}
        />
        <circle
          cx={center}
          cy={center}
          r="48"
          className="fill-none stroke-proveniq-accent"
          strokeWidth="2"
        />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-proveniq-accent text-sm font-bold"
        >
          Core
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-400 text-[9px] font-mono"
        >
          Orchestrate
        </text>

        {shouldAnimatePackets &&
          nodePositions.map((_, i) => (
            <motion.circle
              key={`packet-${i}`}
              r="6"
              className="fill-proveniq-success"
              filter="url(#glow)"
              variants={packetVariants}
              initial="initial"
              animate="animate"
              style={{
                offsetPath: `path('M ${center + nodePositions[i].x} ${center + nodePositions[i].y} L ${center} ${center}')`,
              }}
              transition={{
                duration: 2,
                ease: EASE_HEAVY,
                repeat: Infinity,
                repeatDelay: 1,
                delay: i * PACKET_STAGGER_DELAY,
              }}
            />
          ))}
      </svg>
    </div>
  );
}
