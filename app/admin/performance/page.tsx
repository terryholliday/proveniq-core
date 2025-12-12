"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { VITALS_THRESHOLDS } from "@/lib/vitals";

interface VitalsMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  count: number;
}

interface LatencyMetric {
  path: string;
  method: string;
  avgDuration: number;
  count: number;
  errorRate: number;
}

export default function PerformanceDashboard() {
  const [vitals, setVitals] = useState<VitalsMetric[]>([]);
  const [latency, setLatency] = useState<LatencyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/performance?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setVitals(data.vitals || []);
        setLatency(data.latency || []);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "text-green-400 bg-green-500/20";
      case "needs-improvement":
        return "text-yellow-400 bg-yellow-500/20";
      case "poor":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === "CLS") return value.toFixed(3);
    return `${Math.round(value)}ms`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor web vitals and API latency</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "1h" | "24h" | "7d")}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Web Vitals */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Core Web Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {["LCP", "INP", "CLS", "FCP", "TTFB"].map((metric) => {
            const data = vitals.find((v) => v.name === metric);
            const threshold = VITALS_THRESHOLDS[metric as keyof typeof VITALS_THRESHOLDS];

            return (
              <motion.div
                key={metric}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">{metric}</span>
                  {data && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getRatingColor(
                        data.rating
                      )}`}
                    >
                      {data.rating}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {data ? formatValue(metric, data.value) : "—"}
                </div>
                <div className="text-xs text-gray-500">
                  {threshold && (
                    <>
                      Good: ≤{metric === "CLS" ? threshold.good : `${threshold.good}ms`}
                    </>
                  )}
                </div>
                {data && (
                  <div className="mt-2 text-xs text-gray-500">
                    {data.count} samples
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* API Latency */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          API Latency
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                  Avg Latency
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                  Requests
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                  Error Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {latency.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No latency data available
                  </td>
                </tr>
              ) : (
                latency.map((item, index) => (
                  <motion.tr
                    key={`${item.method}-${item.path}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-sm text-white font-mono">
                      {item.path}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          item.method === "GET"
                            ? "bg-green-500/20 text-green-400"
                            : item.method === "POST"
                            ? "bg-blue-500/20 text-blue-400"
                            : item.method === "PUT"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm ${
                          item.avgDuration < 100
                            ? "text-green-400"
                            : item.avgDuration < 500
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.avgDuration}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm ${
                          item.errorRate === 0
                            ? "text-green-400"
                            : item.errorRate < 5
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.errorRate.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
