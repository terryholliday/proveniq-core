"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  created: "text-green-400",
  updated: "text-blue-400",
  deleted: "text-red-400",
  login: "text-cyan-400",
  logout: "text-gray-400",
  verified: "text-emerald-400",
  failed: "text-red-500",
  revoked: "text-orange-400",
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return color;
  }
  return "text-gray-300";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function AuditDashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.offset]);

  async function fetchLogs() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", pagination.limit.toString());
      params.set("offset", pagination.offset.toString());

      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.action) params.set("action", filters.action);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const response = await fetch(`/api/audit?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      const result = data.data as AuditLogsResponse;

      setLogs(result.logs);
      setPagination((prev) => ({
        ...prev,
        total: result.total,
        hasMore: result.hasMore,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }

  function handleNextPage() {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  }

  function handlePrevPage() {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">
            Monitor all system activities and security events
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Entity Type
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              >
                <option value="">All</option>
                <option value="user">User</option>
                <option value="organization">Organization</option>
                <option value="asset">Asset</option>
                <option value="verification">Verification</option>
                <option value="api_key">API Key</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                placeholder="e.g., user.login"
                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              Error: {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-400">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-gray-500 ml-1 font-mono text-xs">
                            ({log.entityId.slice(0, 8)}...)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {log.user?.email ?? "System"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {log.ipAddress ?? "-"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Showing {pagination.offset + 1} to{" "}
              {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
              {pagination.total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                className="px-4 py-2 bg-white/10 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="px-4 py-2 bg-white/10 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
