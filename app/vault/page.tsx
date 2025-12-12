"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { File, Upload, Download, Trash2, FileText, Image, Film } from "lucide-react";
import { formatBytes } from "@/lib/physics"; // Assuming helper exists, or inline it

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface Document {
  id: string;
  name: string;
  contentType: string;
  size: number;
  status: string;
  url: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

export default function DocumentVaultPage({
  params
}: {
  params: { organizationId: string }
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch(`/api/documents?organizationId=${params.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Initiate upload
      const initRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: params.organizationId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!initRes.ok) throw new Error("Failed to initiate upload");
      const { data: { uploadUrl, document } } = await initRes.json();

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3. Confirm upload
      await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: document.id,
          status: "UPLOADED",
        }),
      });

      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-purple-400" />;
    if (type.startsWith("video/")) return <Film className="w-5 h-5 text-red-400" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Document Vault</h1>
          <p className="text-gray-400">Secure storage for organization assets</p>
        </div>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded font-medium cursor-pointer hover:bg-cyan-400 transition-colors ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10 text-gray-400">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No documents found. Upload one to get started.
          </div>
        ) : (
          documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/50 rounded-lg">
                  {getIcon(doc.contentType)}
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">{doc.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{doc.user?.name || "Unknown"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/10 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
