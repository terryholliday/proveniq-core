"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  Users,
  FileCheck,
  Bell,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRealtime, RealtimeEvent } from "@/lib/realtime/useRealtime";

interface DashboardStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingVerifications: number;
  activeUsers: number;
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    timestamp: string;
    user?: string;
  }[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: typeof Activity;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  const { isConnected, lastEvent } = useRealtime({
    onEvent: (event) => {
      setRealtimeEvents((prev) => [event, ...prev].slice(0, 10));
      
      // Update stats based on event type
      if (event.type === "asset.created" || event.type === "verification.completed") {
        fetchStats();
      }
    },
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time overview of your platform</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-2 text-sm text-green-400">
              <Wifi className="w-4 h-4" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <WifiOff className="w-4 h-4" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assets"
          value={stats?.totalAssets ?? 0}
          change={12}
          icon={TrendingUp}
          color="bg-cyan-500/20 text-cyan-400"
        />
        <StatCard
          title="Verified Assets"
          value={stats?.verifiedAssets ?? 0}
          change={8}
          icon={FileCheck}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          title="Pending Verifications"
          value={stats?.pendingVerifications ?? 0}
          change={-5}
          icon={Clock}
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          change={15}
          icon={Users}
          color="bg-purple-500/20 text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : stats?.recentActivity?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent activity</div>
            ) : (
              stats?.recentActivity?.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.entityType} • {activity.user || "System"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Live Events */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Live Events
            {isConnected && (
              <span className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </h2>
          <div className="space-y-3">
            {realtimeEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isConnected ? "Waiting for events..." : "Connect to see live events"}
              </div>
            ) : (
              realtimeEvents.map((event, index) => (
                <motion.div
                  key={`${event.type}-${event.timestamp}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border-l-2 border-purple-500"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{event.type}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {JSON.stringify(event.data)}
                    </p>
                  </div>
                  {event.timestamp && (
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
