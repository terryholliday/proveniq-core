"use client";

import { motion, MotionValue } from "framer-motion";

interface SafeAssetProps {
  doorOpacity: MotionValue<number>;
  className?: string;
  width?: number;
  height?: number;
}

interface InternalComponent {
  id: string;
  label: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

const INTERNAL_COMPONENTS: InternalComponent[] = [
  { id: "camera", label: "Camera Module", x: 120, y: 80, labelX: 220, labelY: 60 },
  { id: "scale", label: "Weight Scale", x: 120, y: 180, labelX: 220, labelY: 180 },
  { id: "depth", label: "Depth Sensor", x: 120, y: 280, labelX: 220, labelY: 300 },
];

export function SafeAsset({
  doorOpacity,
  className = "",
  width = 400,
  height = 500,
}: SafeAssetProps) {
  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      width={width}
      height={height}
      aria-label="Proveniq Locker cutaway diagram"
    >
      <defs>
        <linearGradient id="safe-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="safe-interior" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <filter id="locker-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="40"
        y="40"
        width="320"
        height="420"
        rx="8"
        fill="url(#safe-body)"
        stroke="#475569"
        strokeWidth="2"
      />

      <rect
        x="60"
        y="60"
        width="280"
        height="380"
        rx="4"
        fill="url(#safe-interior)"
      />

      {INTERNAL_COMPONENTS.map((component) => (
        <g key={component.id}>
          <circle
            cx={component.x}
            cy={component.y}
            r="24"
            fill="#1e293b"
            stroke="#0ea5e9"
            strokeWidth="2"
          />

          <circle
            cx={component.x}
            cy={component.y}
            r="8"
            fill="#0ea5e9"
            filter="url(#locker-glow)"
          />

          <line
            x1={component.x + 24}
            y1={component.y}
            x2={component.labelX}
            y2={component.labelY}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 2"
          />

          <circle
            cx={component.labelX}
            cy={component.labelY}
            r="4"
            fill="#0ea5e9"
          />

          <text
            x={component.labelX + 12}
            y={component.labelY + 4}
            className="fill-slate-300 text-xs font-medium"
          >
            {component.label}
          </text>
        </g>
      ))}

      <g>
        <rect
          x="260"
          y="200"
          width="60"
          height="100"
          rx="2"
          fill="#334155"
          stroke="#475569"
          strokeWidth="1"
        />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x="270"
            y={215 + i * 20}
            width="40"
            height="12"
            rx="1"
            fill="#1e293b"
          />
        ))}
      </g>

      <motion.g style={{ opacity: doorOpacity }}>
        <rect
          x="50"
          y="50"
          width="300"
          height="400"
          rx="6"
          fill="#475569"
          stroke="#64748b"
          strokeWidth="3"
        />

        <rect
          x="70"
          y="70"
          width="260"
          height="360"
          rx="4"
          fill="#334155"
        />

        <circle
          cx="280"
          cy="250"
          r="50"
          fill="none"
          stroke="#64748b"
          strokeWidth="4"
        />
        <circle
          cx="280"
          cy="250"
          r="35"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="2"
        />

        <g transform="translate(280, 250)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="0"
              y1="-20"
              x2="0"
              y2="-30"
              stroke="#64748b"
              strokeWidth="2"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>

        <rect
          x="100"
          y="230"
          width="80"
          height="40"
          rx="4"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />
        <circle cx="120" cy="250" r="8" fill="#334155" />
        <circle cx="140" cy="250" r="8" fill="#334155" />
        <circle cx="160" cy="250" r="8" fill="#334155" />

        <text
          x="200"
          y="430"
          textAnchor="middle"
          className="fill-slate-500 text-[10px] font-mono uppercase tracking-wider"
        >
          Anti-Fraud Locker
        </text>
      </motion.g>
    </svg>
  );
}
