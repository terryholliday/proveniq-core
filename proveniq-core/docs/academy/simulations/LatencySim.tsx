/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  [SIMULATOR] TRAINING COMPONENT                                              ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  Component:   LatencySim                                                     ║
 * ║  Title:       The Flywheel Latency Simulator                                 ║
 * ║  Objective:   Keep latency under 50ms while TPS rises to 10,000              ║
 * ║  Failure:     System "crashes" at 100ms latency                              ║
 * ║                                                                              ║
 * ║  Controls:                                                                   ║
 * ║  • Thread Count (1-64)                                                       ║
 * ║  • Batch Size (1-1000)                                                       ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

interface SimulationState {
  status: "idle" | "running" | "passed" | "crashed";
  currentTPS: number;
  targetTPS: number;
  currentLatency: number;
  threadCount: number;
  batchSize: number;
  elapsedTime: number;
  score: number;
  latencyHistory: number[];
  tpsHistory: number[];
}

const SIMULATION_CONFIG = {
  targetTPS: 10000,
  latencyTarget: 50,
  latencyCrash: 100,
  simulationDuration: 60, // seconds
  tickInterval: 100, // ms
  historyLength: 100,
  tpsRampRate: 200, // TPS increase per second
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: PHYSICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculates latency based on system parameters.
 * 
 * Physics Model:
 * - Base latency decreases with more threads (parallelism)
 * - Latency increases with higher TPS (load)
 * - Batch size reduces per-request overhead but adds batching delay
 * - There's an optimal "sweet spot" for thread/batch configuration
 */
function calculateLatency(
  tps: number,
  threadCount: number,
  batchSize: number
): number {
  // Base latency from processing
  const baseLatency = 10;

  // Load factor: more TPS = more latency
  const loadFactor = Math.pow(tps / 1000, 1.5);

  // Thread efficiency: more threads help, but with diminishing returns
  // Optimal around 16-32 threads for this workload
  const threadEfficiency = Math.min(1, threadCount / 16) * 
    (1 - Math.max(0, (threadCount - 32) / 64) * 0.3);

  // Batch efficiency: larger batches reduce overhead but add delay
  // Optimal around 100-500 for high TPS
  const batchOverhead = 50 / Math.max(1, batchSize);
  const batchDelay = batchSize * 0.02;
  const batchEfficiency = batchOverhead + batchDelay;

  // Context switching penalty for too many threads
  const contextSwitchPenalty = Math.max(0, (threadCount - 32) * 0.5);

  // Memory pressure at high batch sizes
  const memoryPressure = Math.max(0, (batchSize - 500) * 0.05);

  // Calculate final latency
  let latency = baseLatency + 
    (loadFactor * 30) / Math.max(0.1, threadEfficiency) +
    batchEfficiency +
    contextSwitchPenalty +
    memoryPressure;

  // Add some realistic noise (±10%)
  const noise = (Math.random() - 0.5) * 0.2 * latency;
  latency += noise;

  // Clamp to reasonable bounds
  return Math.max(5, Math.min(500, latency));
}

/**
 * Calculate score based on performance
 */
function calculateScore(
  latencyHistory: number[],
  maxTpsReached: number,
  crashed: boolean
): number {
  if (crashed) return 0;

  // Average latency score (lower is better)
  const avgLatency = latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length;
  const latencyScore = Math.max(0, 100 - (avgLatency - 20) * 2);

  // TPS score (higher is better)
  const tpsScore = (maxTpsReached / SIMULATION_CONFIG.targetTPS) * 100;

  // Combined score
  return Math.round((latencyScore * 0.6 + tpsScore * 0.4));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: VISUALIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function LatencyGraph({ 
  history, 
  target, 
  crash 
}: { 
  history: number[]; 
  target: number; 
  crash: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxLatency = 120;

    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw crash zone (above 100ms)
    const crashY = height - (crash / maxLatency) * height;
    ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
    ctx.fillRect(0, 0, width, crashY);

    // Draw crash line
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, crashY);
    ctx.lineTo(width, crashY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target zone (below 50ms)
    const targetY = height - (target / maxLatency) * height;
    ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
    ctx.fillRect(0, targetY, width, height - targetY);

    // Draw target line
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw latency line
    if (history.length > 1) {
      ctx.strokeStyle = "#4a9eff";
      ctx.lineWidth = 3;
      ctx.beginPath();

      history.forEach((latency, i) => {
        const x = (i / (SIMULATION_CONFIG.historyLength - 1)) * width;
        const y = height - (Math.min(latency, maxLatency) / maxLatency) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw glow effect for current point
      const lastX = width;
      const lastY = height - (Math.min(history[history.length - 1], maxLatency) / maxLatency) * height;
      
      const gradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 20);
      gradient.addColorStop(0, "rgba(74, 158, 255, 0.8)");
      gradient.addColorStop(1, "rgba(74, 158, 255, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw current point
      ctx.fillStyle = "#4a9eff";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = "#888";
    ctx.font = "12px monospace";
    ctx.fillText("120ms", 5, 15);
    ctx.fillText(`${crash}ms CRASH`, 5, crashY - 5);
    ctx.fillText(`${target}ms TARGET`, 5, targetY - 5);
    ctx.fillText("0ms", 5, height - 5);

  }, [history, target, crash]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={300} 
      className="w-full rounded-lg border border-gray-700"
    />
  );
}

function TPSMeter({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-100"
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white">
        {current.toLocaleString()} / {target.toLocaleString()} TPS
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-lg font-mono font-bold text-blue-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-6
                   [&::-webkit-slider-thumb]:h-6
                   [&::-webkit-slider-thumb]:bg-blue-500
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-400
                   [&::-webkit-slider-thumb]:transition-colors"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        {hint && <span className="text-gray-400">{hint}</span>}
        <span>{max}</span>
      </div>
    </div>
  );
}

function MetricDisplay({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: number | string;
  unit?: string;
  status?: "good" | "warning" | "critical";
}) {
  const statusColors = {
    good: "text-green-400",
    warning: "text-yellow-400",
    critical: "text-red-400",
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-mono font-bold mt-1 ${status ? statusColors[status] : "text-white"}`}>
        {typeof value === "number" ? value.toFixed(1) : value}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function CrashScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="fixed inset-0 bg-red-900 flex flex-col items-center justify-center z-50 animate-pulse">
      <div className="text-center">
        <div className="text-8xl mb-8">💀</div>
        <h1 className="text-6xl font-bold text-white mb-4">SYSTEM CRASH</h1>
        <p className="text-2xl text-red-200 mb-8">
          Latency exceeded 100ms - Connection pool exhausted
        </p>
        <div className="font-mono text-red-300 text-left bg-red-950 p-6 rounded-lg mb-8 max-w-2xl">
          <p>Error: ETIMEDOUT - Database connection timeout</p>
          <p>Error: ECONNRESET - Connection reset by peer</p>
          <p>Error: ENOMEM - Out of memory</p>
          <p>Fatal: Unhandled promise rejection</p>
          <p className="mt-4 text-red-400">
            Stack trace: at ConnectionPool.acquire (pool.js:142)
          </p>
        </div>
        <button
          onClick={onRestart}
          className="bg-white text-red-900 px-8 py-4 rounded-lg font-bold text-xl
                     hover:bg-red-100 transition-colors"
        >
          🔄 Restart Simulation
        </button>
      </div>
    </div>
  );
}

function SuccessScreen({ score, onRestart }: { score: number; onRestart: () => void }) {
  return (
    <div className="fixed inset-0 bg-green-900 flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <div className="text-8xl mb-8">🎉</div>
        <h1 className="text-6xl font-bold text-white mb-4">SIMULATION PASSED</h1>
        <p className="text-2xl text-green-200 mb-8">
          You successfully scaled to 10,000 TPS while keeping latency under 50ms!
        </p>
        <div className="text-9xl font-bold text-white mb-8">
          {score}<span className="text-4xl">/100</span>
        </div>
        <div className="font-mono text-green-300 text-left bg-green-950 p-6 rounded-lg mb-8 max-w-2xl">
          <p>✓ Target TPS reached: 10,000</p>
          <p>✓ Latency maintained under 50ms</p>
          <p>✓ No connection pool exhaustion</p>
          <p>✓ System remained stable</p>
        </div>
        <button
          onClick={onRestart}
          className="bg-white text-green-900 px-8 py-4 rounded-lg font-bold text-xl
                     hover:bg-green-100 transition-colors"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LatencySim() {
  const [state, setState] = useState<SimulationState>({
    status: "idle",
    currentTPS: 0,
    targetTPS: SIMULATION_CONFIG.targetTPS,
    currentLatency: 10,
    threadCount: 8,
    batchSize: 50,
    elapsedTime: 0,
    score: 0,
    latencyHistory: [],
    tpsHistory: [],
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxTpsRef = useRef(0);

  const startSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "running",
      currentTPS: 100,
      elapsedTime: 0,
      latencyHistory: [],
      tpsHistory: [],
      score: 0,
    }));
    maxTpsRef.current = 0;
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  const restartSimulation = useCallback(() => {
    setState({
      status: "idle",
      currentTPS: 0,
      targetTPS: SIMULATION_CONFIG.targetTPS,
      currentLatency: 10,
      threadCount: 8,
      batchSize: 50,
      elapsedTime: 0,
      score: 0,
      latencyHistory: [],
      tpsHistory: [],
    });
    maxTpsRef.current = 0;
  }, []);

  // Simulation tick
  useEffect(() => {
    if (state.status !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        // Calculate new TPS (ramps up over time)
        const tpsIncrement = (SIMULATION_CONFIG.tpsRampRate * SIMULATION_CONFIG.tickInterval) / 1000;
        const newTPS = Math.min(prev.currentTPS + tpsIncrement, SIMULATION_CONFIG.targetTPS);

        // Calculate latency based on current settings
        const newLatency = calculateLatency(newTPS, prev.threadCount, prev.batchSize);

        // Update history
        const newLatencyHistory = [...prev.latencyHistory, newLatency].slice(-SIMULATION_CONFIG.historyLength);
        const newTpsHistory = [...prev.tpsHistory, newTPS].slice(-SIMULATION_CONFIG.historyLength);

        // Track max TPS
        if (newTPS > maxTpsRef.current) {
          maxTpsRef.current = newTPS;
        }

        // Check for crash
        if (newLatency >= SIMULATION_CONFIG.latencyCrash) {
          return {
            ...prev,
            status: "crashed",
            currentLatency: newLatency,
            latencyHistory: newLatencyHistory,
            score: 0,
          };
        }

        // Check for success
        const newElapsedTime = prev.elapsedTime + SIMULATION_CONFIG.tickInterval / 1000;
        if (newTPS >= SIMULATION_CONFIG.targetTPS && newLatency < SIMULATION_CONFIG.latencyTarget) {
          const finalScore = calculateScore(newLatencyHistory, maxTpsRef.current, false);
          return {
            ...prev,
            status: "passed",
            currentTPS: newTPS,
            currentLatency: newLatency,
            elapsedTime: newElapsedTime,
            latencyHistory: newLatencyHistory,
            tpsHistory: newTpsHistory,
            score: finalScore,
          };
        }

        return {
          ...prev,
          currentTPS: newTPS,
          currentLatency: newLatency,
          elapsedTime: newElapsedTime,
          latencyHistory: newLatencyHistory,
          tpsHistory: newTpsHistory,
        };
      });
    }, SIMULATION_CONFIG.tickInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.status]);

  // Determine latency status
  const getLatencyStatus = (latency: number): "good" | "warning" | "critical" => {
    if (latency < SIMULATION_CONFIG.latencyTarget) return "good";
    if (latency < SIMULATION_CONFIG.latencyCrash * 0.8) return "warning";
    return "critical";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Crash Screen */}
      {state.status === "crashed" && <CrashScreen onRestart={restartSimulation} />}

      {/* Success Screen */}
      {state.status === "passed" && (
        <SuccessScreen score={state.score} onRestart={restartSimulation} />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔄 The Flywheel Latency Simulator</h1>
        <p className="text-gray-400">
          C300: Orchestration Physics | Keep latency under 50ms while scaling to 10,000 TPS
        </p>
      </div>

      {/* Instructions */}
      {state.status === "idle" && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4">📋 Mission Briefing</h2>
          <ul className="text-blue-200 space-y-2">
            <li>• <strong>Objective:</strong> Scale the system to 10,000 TPS while keeping latency under 50ms</li>
            <li>• <strong>Controls:</strong> Adjust Thread Count and Batch Size to optimize performance</li>
            <li>• <strong>Failure:</strong> If latency hits 100ms, the system crashes (Red Screen of Death)</li>
            <li>• <strong>Hint:</strong> Find the optimal balance - too many threads cause context switching, too few cause bottlenecks</li>
          </ul>
          <button
            onClick={startSimulation}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-bold text-xl
                       transition-colors"
          >
            🚀 Start Simulation
          </button>
        </div>
      )}

      {/* Main Simulation UI */}
      {state.status === "running" && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricDisplay
              label="Current Latency"
              value={state.currentLatency}
              unit="ms"
              status={getLatencyStatus(state.currentLatency)}
            />
            <MetricDisplay
              label="Current TPS"
              value={state.currentTPS.toFixed(0)}
            />
            <MetricDisplay
              label="Elapsed Time"
              value={state.elapsedTime.toFixed(1)}
              unit="s"
            />
            <MetricDisplay
              label="Target"
              value={`${SIMULATION_CONFIG.latencyTarget}ms @ ${SIMULATION_CONFIG.targetTPS.toLocaleString()} TPS`}
            />
          </div>

          {/* TPS Progress */}
          <div className="mb-6">
            <TPSMeter current={state.currentTPS} target={state.targetTPS} />
          </div>

          {/* Latency Graph */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-2">📈 Ingest Latency (Live)</h2>
            <LatencyGraph
              history={state.latencyHistory}
              target={SIMULATION_CONFIG.latencyTarget}
              crash={SIMULATION_CONFIG.latencyCrash}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <Slider
                label="Thread Count"
                value={state.threadCount}
                min={1}
                max={64}
                step={1}
                onChange={(value) => setState((prev) => ({ ...prev, threadCount: value }))}
                hint="Optimal: 16-32"
              />
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <Slider
                label="Batch Size"
                value={state.batchSize}
                min={1}
                max={1000}
                step={10}
                onChange={(value) => setState((prev) => ({ ...prev, batchSize: value }))}
                hint="Optimal: 100-500"
              />
            </div>
          </div>

          {/* Warning Zone */}
          {state.currentLatency > SIMULATION_CONFIG.latencyTarget && (
            <div className={`rounded-lg p-4 mb-6 ${
              state.currentLatency > SIMULATION_CONFIG.latencyCrash * 0.8
                ? "bg-red-900/50 border border-red-500"
                : "bg-yellow-900/50 border border-yellow-500"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {state.currentLatency > SIMULATION_CONFIG.latencyCrash * 0.8 ? "🚨" : "⚠️"}
                </span>
                <div>
                  <div className="font-bold">
                    {state.currentLatency > SIMULATION_CONFIG.latencyCrash * 0.8
                      ? "CRITICAL: System approaching crash threshold!"
                      : "WARNING: Latency exceeds target"}
                  </div>
                  <div className="text-sm opacity-80">
                    Adjust Thread Count or Batch Size to reduce latency
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stop Button */}
          <div className="text-center">
            <button
              onClick={stopSimulation}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold
                         transition-colors"
            >
              ⏹ Stop Simulation
            </button>
          </div>
        </>
      )}

      {/* Physics Explanation */}
      <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">⚙️ System Physics</h2>
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h3 className="font-bold text-white mb-2">Thread Count</h3>
            <ul className="space-y-1">
              <li>• More threads = more parallelism</li>
              <li>• Optimal range: 16-32 threads</li>
              <li>• Too many threads = context switching overhead</li>
              <li>• Too few threads = processing bottleneck</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2">Batch Size</h3>
            <ul className="space-y-1">
              <li>• Larger batches = less per-request overhead</li>
              <li>• Optimal range: 100-500 items</li>
              <li>• Too large = memory pressure + batching delay</li>
              <li>• Too small = high overhead per request</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grading Criteria */}
      <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">📊 Grading Criteria</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-bold text-green-400 mb-2">✅ Pass Criteria</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Reach 10,000 TPS</li>
              <li>• Maintain latency under 50ms</li>
              <li>• No system crash</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-red-400 mb-2">❌ Fail Criteria</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Latency exceeds 100ms (crash)</li>
              <li>• Unable to reach target TPS</li>
              <li>• System instability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
