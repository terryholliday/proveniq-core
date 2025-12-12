"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, Activity } from "lucide-react";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  _count: {
    deliveries: number;
  };
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  "asset.created",
  "asset.updated",
  "verification.completed",
  "verification.failed",
];

export default function WebhooksPage({ 
  params 
}: { 
  params: { organizationId: string } 
}) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as string[],
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch(`/api/webhooks?organizationId=${params.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: params.organizationId,
          ...newWebhook,
        }),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewWebhook({ url: "", events: [] });
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Failed to create webhook", error);
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/webhooks?id=${id}&organizationId=${params.organizationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete webhook", error);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-gray-400">Manage event subscriptions and integrations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded font-medium hover:bg-cyan-400"
        >
          <Plus className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">New Webhook Endpoint</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Endpoint URL</label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://api.yourapp.com/webhooks"
                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Events</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, event],
                          });
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter((e) => e !== event),
                          });
                        }
                      }}
                      className="rounded border-gray-600 bg-black text-cyan-500"
                    />
                    <span className="text-sm font-mono">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createWebhook}
                disabled={!newWebhook.url || newWebhook.events.length === 0}
                className="px-4 py-2 bg-cyan-500 text-black rounded font-medium hover:bg-cyan-400 disabled:opacity-50"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10 text-gray-400">
            No webhooks configured. Add one to start receiving events.
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white/5 border border-white/10 rounded-lg p-6 flex items-start justify-between group hover:border-white/20 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-mono text-lg text-cyan-400">{webhook.url}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    webhook.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {webhook.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {webhook.events.map((event) => (
                    <span key={event} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 font-mono">
                      {event}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {webhook._count.deliveries} deliveries
                  </div>
                  <div>
                    Secret: <code className="bg-black/50 px-2 py-0.5 rounded">{webhook.secret.slice(0, 8)}...</code>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded transition-colors"
                  title="Test delivery"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteWebhook(webhook.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                  title="Delete webhook"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
