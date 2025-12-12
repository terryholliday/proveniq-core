/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  [SIMULATOR] SIMULATION ARTIFACT                                             ║
 * ║  ═══════════════════════════════════════════════════════════════════════════ ║
 * ║                                                                              ║
 * ║  Simulation:  HIGH-LOAD-INGEST                                               ║
 * ║  Title:       The Flywheel Stress Test                                       ║
 * ║  Target:      10,000 TPS Load Simulation                                     ║
 * ║  Duration:    Variable (until failure or completion)                         ║
 * ║                                                                              ║
 * ║  Standards:                                                                  ║
 * ║  • Nvidia: Latency optimization graded                                       ║
 * ║  • Apple: Visual dashboard required                                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface SimulationConfig {
  targetTPS: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  organizationId: string;
  apiEndpoint: string;
  apiKey: string;
}

interface RequestMetrics {
  id: string;
  timestamp: number;
  latency: number;
  status: number;
  success: boolean;
  error?: string;
}

interface AggregateMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  currentTPS: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  errorRate: number;
  throughput: number;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  dbConnections: number;
  queueDepth: number;
  status: "healthy" | "degraded" | "critical";
}

interface SimulationState {
  status: "idle" | "running" | "paused" | "completed" | "failed";
  startTime: number | null;
  elapsedTime: number;
  metrics: AggregateMetrics;
  health: SystemHealth;
  recentRequests: RequestMetrics[];
  bottlenecks: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class LoadSimulationEngine {
  private config: SimulationConfig;
  private metrics: RequestMetrics[] = [];
  private isRunning = false;
  private onUpdate: (state: Partial<SimulationState>) => void;

  constructor(
    config: SimulationConfig,
    onUpdate: (state: Partial<SimulationState>) => void
  ) {
    this.config = config;
    this.onUpdate = onUpdate;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.metrics = [];

    const startTime = Date.now();
    const endTime = startTime + this.config.duration * 1000;

    // Ramp-up phase
    let currentTPS = 0;
    const rampIncrement =
      this.config.targetTPS / (this.config.rampUpTime * 10);

    while (this.isRunning && Date.now() < endTime) {
      const elapsed = (Date.now() - startTime) / 1000;

      // Calculate current TPS based on ramp-up
      if (elapsed < this.config.rampUpTime) {
        currentTPS = Math.min(
          this.config.targetTPS,
          rampIncrement * elapsed * 10
        );
      } else {
        currentTPS = this.config.targetTPS;
      }

      // Send batch of requests
      const batchSize = Math.ceil(currentTPS / 10); // 10 batches per second
      await this.sendBatch(batchSize);

      // Update metrics
      this.onUpdate({
        elapsedTime: elapsed,
        metrics: this.calculateAggregates(),
        recentRequests: this.metrics.slice(-100),
        bottlenecks: this.identifyBottlenecks(),
      });

      // Wait for next batch
      await this.sleep(100);
    }

    this.isRunning = false;
    this.onUpdate({ status: "completed" });
  }

  stop(): void {
    this.isRunning = false;
  }

  private async sendBatch(size: number): Promise<void> {
    const promises = Array.from({ length: size }, () => this.sendRequest());
    await Promise.allSettled(promises);
  }

  private async sendRequest(): Promise<void> {
    const id = crypto.randomUUID();
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.config.apiEndpoint}/api/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          name: `Load Test Asset ${id}`,
          category: "load_test",
          organizationId: this.config.organizationId,
          metadata: {
            simulationId: id,
            timestamp: Date.now(),
          },
        }),
      });

      const latency = performance.now() - startTime;

      this.metrics.push({
        id,
        timestamp: Date.now(),
        latency,
        status: response.status,
        success: response.ok,
      });
    } catch (error) {
      const latency = performance.now() - startTime;

      this.metrics.push({
        id,
        timestamp: Date.now(),
        latency,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private calculateAggregates(): AggregateMetrics {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        currentTPS: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        maxLatency: 0,
        minLatency: 0,
        errorRate: 0,
        throughput: 0,
      };
    }

    const successful = this.metrics.filter((m) => m.success);
    const failed = this.metrics.filter((m) => !m.success);
    const latencies = this.metrics.map((m) => m.latency).sort((a, b) => a - b);

    // Calculate TPS from last second
    const oneSecondAgo = Date.now() - 1000;
    const recentRequests = this.metrics.filter(
      (m) => m.timestamp > oneSecondAgo
    );

    return {
      totalRequests: this.metrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      currentTPS: recentRequests.length,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: this.percentile(latencies, 50),
      p95Latency: this.percentile(latencies, 95),
      p99Latency: this.percentile(latencies, 99),
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      errorRate: (failed.length / this.metrics.length) * 100,
      throughput: successful.length,
    };
  }

  private percentile(arr: number[], p: number): number {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)] || 0;
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const aggregates = this.calculateAggregates();

    if (aggregates.p99Latency > 1000) {
      bottlenecks.push("High P99 latency (>1s) - possible database bottleneck");
    }

    if (aggregates.errorRate > 5) {
      bottlenecks.push("Error rate >5% - check connection pool or rate limits");
    }

    if (aggregates.currentTPS < this.config.targetTPS * 0.8) {
      bottlenecks.push("TPS below target - system may be saturated");
    }

    const recentErrors = this.metrics
      .slice(-100)
      .filter((m) => !m.success)
      .map((m) => m.error);

    if (recentErrors.some((e) => e?.includes("connection"))) {
      bottlenecks.push("Connection errors detected - pool exhaustion likely");
    }

    if (recentErrors.some((e) => e?.includes("timeout"))) {
      bottlenecks.push("Timeout errors - increase timeout or reduce load");
    }

    return bottlenecks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: VISUALIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({
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
    good: "text-green-400 border-green-400/30",
    warning: "text-yellow-400 border-yellow-400/30",
    critical: "text-red-400 border-red-400/30",
  };

  return (
    <div
      className={`bg-gray-900 border rounded-lg p-4 ${
        status ? statusColors[status] : "border-gray-700"
      }`}
    >
      <div className="text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-mono font-bold mt-1">
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function LatencyChart({ metrics }: { metrics: RequestMetrics[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw latency line
    const maxLatency = Math.max(...metrics.map((m) => m.latency), 100);
    const points = metrics.slice(-200);

    ctx.strokeStyle = "#4a9eff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((m, i) => {
      const x = (i / points.length) * width;
      const y = height - (m.latency / maxLatency) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw P95 line
    const latencies = points.map((m) => m.latency).sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p95Y = height - (p95 / maxLatency) * height;

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, p95Y);
    ctx.lineTo(width, p95Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = "#888";
    ctx.font = "10px monospace";
    ctx.fillText(`Max: ${maxLatency.toFixed(0)}ms`, 5, 12);
    ctx.fillText(`P95: ${p95.toFixed(0)}ms`, 5, height - 5);
  }, [metrics]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        Latency Distribution (Last 200 requests)
      </div>
      <canvas ref={canvasRef} width={600} height={150} className="w-full" />
    </div>
  );
}

function TPSGauge({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  const status =
    percentage >= 90 ? "good" : percentage >= 70 ? "warning" : "critical";

  const colors = {
    good: "#22c55e",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        Throughput (TPS)
      </div>
      <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors[status],
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold">
          {current.toLocaleString()} / {target.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function BottleneckAlert({ bottlenecks }: { bottlenecks: string[] }) {
  if (bottlenecks.length === 0) return null;

  return (
    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
      <div className="text-red-400 font-bold mb-2">⚠️ Bottlenecks Detected</div>
      <ul className="text-sm text-red-300 space-y-1">
        {bottlenecks.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: MAIN SIMULATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HighLoadIngestSimulation() {
  const [config, setConfig] = useState<SimulationConfig>({
    targetTPS: 1000,
    duration: 60,
    rampUpTime: 10,
    organizationId: "",
    apiEndpoint: "http://localhost:3000",
    apiKey: "",
  });

  const [state, setState] = useState<SimulationState>({
    status: "idle",
    startTime: null,
    elapsedTime: 0,
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      currentTPS: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      maxLatency: 0,
      minLatency: 0,
      errorRate: 0,
      throughput: 0,
    },
    health: {
      cpu: 0,
      memory: 0,
      dbConnections: 0,
      queueDepth: 0,
      status: "healthy",
    },
    recentRequests: [],
    bottlenecks: [],
  });

  const engineRef = useRef<LoadSimulationEngine | null>(null);

  const handleStart = useCallback(() => {
    if (!config.organizationId || !config.apiKey) {
      alert("Please provide Organization ID and API Key");
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "running",
      startTime: Date.now(),
    }));

    engineRef.current = new LoadSimulationEngine(config, (update) => {
      setState((prev) => ({ ...prev, ...update }));
    });

    engineRef.current.start();
  }, [config]);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    setState((prev) => ({ ...prev, status: "completed" }));
  }, []);

  const getLatencyStatus = (
    latency: number
  ): "good" | "warning" | "critical" => {
    if (latency < 100) return "good";
    if (latency < 500) return "warning";
    return "critical";
  };

  const getErrorStatus = (rate: number): "good" | "warning" | "critical" => {
    if (rate < 1) return "good";
    if (rate < 5) return "warning";
    return "critical";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          🔄 The Flywheel Stress Test
        </h1>
        <p className="text-gray-400">
          C300: Orchestration Physics | High-Load Ingest Simulation
        </p>
      </div>

      {/* Configuration Panel */}
      {state.status === "idle" && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Target TPS
              </label>
              <input
                type="number"
                value={config.targetTPS}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    targetTPS: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    duration: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Ramp-up Time (seconds)
              </label>
              <input
                type="number"
                value={config.rampUpTime}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    rampUpTime: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={config.apiEndpoint}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, apiEndpoint: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Organization ID
              </label>
              <input
                type="text"
                value={config.organizationId}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, organizationId: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                placeholder="org_xxx"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, apiKey: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                placeholder="pk_xxx"
              />
            </div>
          </div>
          <button
            onClick={handleStart}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
          >
            🚀 Start Simulation
          </button>
        </div>
      )}

      {/* Running State */}
      {state.status !== "idle" && (
        <>
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  state.status === "running"
                    ? "bg-green-500 animate-pulse"
                    : state.status === "completed"
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
              />
              <span className="font-mono uppercase">
                {state.status}
              </span>
              <span className="text-gray-400">
                Elapsed: {state.elapsedTime.toFixed(1)}s / {config.duration}s
              </span>
            </div>
            {state.status === "running" && (
              <button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* Bottleneck Alerts */}
          <BottleneckAlert bottlenecks={state.bottlenecks} />

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <MetricCard
              label="Total Requests"
              value={state.metrics.totalRequests}
            />
            <MetricCard
              label="Successful"
              value={state.metrics.successfulRequests}
              status="good"
            />
            <MetricCard
              label="Failed"
              value={state.metrics.failedRequests}
              status={state.metrics.failedRequests > 0 ? "critical" : "good"}
            />
            <MetricCard
              label="Error Rate"
              value={state.metrics.errorRate.toFixed(2)}
              unit="%"
              status={getErrorStatus(state.metrics.errorRate)}
            />
          </div>

          {/* TPS Gauge */}
          <div className="mb-6">
            <TPSGauge
              current={state.metrics.currentTPS}
              target={config.targetTPS}
            />
          </div>

          {/* Latency Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard
              label="Avg Latency"
              value={state.metrics.avgLatency.toFixed(0)}
              unit="ms"
              status={getLatencyStatus(state.metrics.avgLatency)}
            />
            <MetricCard
              label="P50 Latency"
              value={state.metrics.p50Latency.toFixed(0)}
              unit="ms"
              status={getLatencyStatus(state.metrics.p50Latency)}
            />
            <MetricCard
              label="P95 Latency"
              value={state.metrics.p95Latency.toFixed(0)}
              unit="ms"
              status={getLatencyStatus(state.metrics.p95Latency)}
            />
            <MetricCard
              label="P99 Latency"
              value={state.metrics.p99Latency.toFixed(0)}
              unit="ms"
              status={getLatencyStatus(state.metrics.p99Latency)}
            />
            <MetricCard
              label="Max Latency"
              value={state.metrics.maxLatency.toFixed(0)}
              unit="ms"
              status={getLatencyStatus(state.metrics.maxLatency)}
            />
          </div>

          {/* Latency Chart */}
          <LatencyChart metrics={state.recentRequests} />
        </>
      )}

      {/* Grading Criteria */}
      <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">📊 Grading Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-bold text-green-400 mb-2">✅ Pass Criteria</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• Sustain 10,000 TPS for 60 seconds</li>
              <li>• P99 latency &lt; 500ms</li>
              <li>• Error rate &lt; 1%</li>
              <li>• No connection pool exhaustion</li>
              <li>• All data persisted correctly</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-red-400 mb-2">❌ Fail Criteria</h3>
            <ul className="text-gray-300 space-y-1">
              <li>• TPS drops below 8,000 for &gt;5 seconds</li>
              <li>• P99 latency exceeds 2,000ms</li>
              <li>• Error rate exceeds 5%</li>
              <li>• Database connection timeout</li>
              <li>• Data loss detected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
