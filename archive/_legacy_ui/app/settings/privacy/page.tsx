"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  FileJson,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export default function PrivacySettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<"anonymize" | "delete">("anonymize");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/compliance/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmation !== "DELETE_MY_DATA") {
      toast.error("Please type DELETE_MY_DATA to confirm");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/compliance/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: deleteAction, confirmation }),
      });

      if (res.ok) {
        toast.success(
          deleteAction === "delete"
            ? "Account deleted. You will be signed out."
            : "Data anonymized successfully"
        );
        if (deleteAction === "delete") {
          window.location.href = "/auth/signout";
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to process request");
      }
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setConfirmation("");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Privacy Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage your data and privacy preferences
        </p>
      </div>

      {/* Data Export */}
      <section className="mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Export Your Data
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Download a copy of all your personal data in JSON format. This
                includes your profile, organizations, API keys, and activity logs.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                <FileJson className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export Data"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Deletion */}
      <section className="mb-8">
        <div className="bg-white/5 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Delete Your Data
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Permanently delete or anonymize your account and all associated
                data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                <UserX className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Info */}
      <section>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Your Privacy Rights
              </h2>
              <ul className="text-sm text-gray-400 space-y-2 mt-3">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-white">Right to Access:</strong> You
                    can request a copy of all data we hold about you.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-white">Right to Erasure:</strong> You
                    can request deletion of your personal data.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-white">Data Portability:</strong> You
                    can export your data in a machine-readable format.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-white">Right to Rectification:</strong>{" "}
                    You can update or correct your personal information.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-black border border-red-500/30 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete Account
              </h3>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              This action is permanent and cannot be undone. All your data will
              be permanently deleted or anonymized.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Choose an option:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-white/20">
                    <input
                      type="radio"
                      name="deleteAction"
                      value="anonymize"
                      checked={deleteAction === "anonymize"}
                      onChange={() => setDeleteAction("anonymize")}
                      className="text-cyan-500"
                    />
                    <div>
                      <span className="text-white text-sm font-medium">
                        Anonymize
                      </span>
                      <p className="text-xs text-gray-500">
                        Remove personal info but keep anonymized records
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-white/10 hover:border-white/20">
                    <input
                      type="radio"
                      name="deleteAction"
                      value="delete"
                      checked={deleteAction === "delete"}
                      onChange={() => setDeleteAction("delete")}
                      className="text-red-500"
                    />
                    <div>
                      <span className="text-white text-sm font-medium">
                        Delete Everything
                      </span>
                      <p className="text-xs text-gray-500">
                        Permanently delete all data and account
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type <code className="text-red-400">DELETE_MY_DATA</code> to
                  confirm:
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE_MY_DATA"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmation("");
                }}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmation !== "DELETE_MY_DATA"}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
