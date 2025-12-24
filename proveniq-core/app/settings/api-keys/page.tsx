"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

const AVAILABLE_SCOPES = [
  { value: "assets:read", label: "Read Assets" },
  { value: "assets:write", label: "Write Assets" },
  { value: "verifications:read", label: "Read Verifications" },
  { value: "verifications:write", label: "Write Verifications" },
  { value: "webhooks:read", label: "Read Webhooks" },
  { value: "webhooks:write", label: "Write Webhooks" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (error) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (scopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes, expiresInDays }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKeySecret(data.apiKey.secret);
        setShowCreate(false);
        setName("");
        setScopes([]);
        setExpiresInDays(null);
        fetchKeys();
        toast.success("API key created");
      } else {
        toast.error("Failed to create API key");
      }
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const res = await fetch(`/api/api-keys?id=${keyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== keyId));
        toast.success("API key deleted");
      } else {
        toast.error("Failed to delete API key");
      }
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-1">
            Manage your API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* New Key Secret Modal */}
      <AnimatePresence>
        {newKeySecret && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">API Key Created</h3>
                  <p className="text-sm text-gray-400">
                    Copy your key now. You won't be able to see it again.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm text-cyan-400 break-all">
                    {showSecret ? newKeySecret : "•".repeat(40)}
                  </code>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-2 text-gray-400 hover:text-white rounded"
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(newKeySecret)}
                      className="p-2 text-gray-400 hover:text-white rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setNewKeySecret(null);
                  setShowSecret(false);
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Create API Key
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My API Key"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Scopes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <button
                        key={scope.value}
                        onClick={() => toggleScope(scope.value)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          scopes.includes(scope.value)
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Expiration (optional)
                  </label>
                  <select
                    value={expiresInDays || ""}
                    onChange={(e) =>
                      setExpiresInDays(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Never expires</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No API keys</h3>
          <p className="text-sm text-gray-400">
            Create an API key to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{key.name}</h4>
                    <p className="text-sm text-gray-500 font-mono">
                      {key.keyPrefix}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {key.revokedAt ? (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                      <XCircle className="w-3 h-3" />
                      Revoked
                    </span>
                  ) : key.expiresAt && new Date(key.expiresAt) < new Date() ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {key.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Created {new Date(key.createdAt).toLocaleDateString()}
                </span>
                {key.lastUsedAt && (
                  <span>
                    Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                  </span>
                )}
                {key.expiresAt && (
                  <span>
                    Expires {new Date(key.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
