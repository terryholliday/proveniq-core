"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Recipient {
  email: string;
  name: string;
}

interface ESignatureProps {
  documentId: string;
  documentName: string;
  organizationId: string;
  onComplete?: (envelopeId: string) => void;
}

export function ESignature({
  documentId,
  documentName,
  organizationId,
  onComplete,
}: ESignatureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([{ email: "", name: "" }]);
  const [emailSubject, setEmailSubject] = useState(`Please sign: ${documentName}`);
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    envelopeId: string;
    signingUrls: { email: string; url: string }[];
  } | null>(null);

  const addRecipient = () => {
    setRecipients([...recipients, { email: "", name: "" }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleSend = async () => {
    // Validate recipients
    const validRecipients = recipients.filter((r) => r.email && r.name);
    if (validRecipients.length === 0) {
      toast.error("Add at least one recipient with email and name");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/esign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          organizationId,
          recipients: validRecipients,
          emailSubject,
          emailBody: emailBody || undefined,
          returnUrl: `${window.location.origin}/esign/complete`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.signatureRequest);
        toast.success("Signature request sent");
        onComplete?.(data.signatureRequest.envelopeId);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send signature request");
      }
    } catch (error) {
      toast.error("Failed to send signature request");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setRecipients([{ email: "", name: "" }]);
    setEmailSubject(`Please sign: ${documentName}`);
    setEmailBody("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-400 transition-colors"
      >
        <FileSignature className="w-4 h-4" />
        Request Signature
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-black border border-white/20 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {result ? (
                // Success state
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Signature Request Sent
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Recipients will receive an email with instructions to sign the document.
                  </p>

                  {result.signingUrls.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-3">
                        Or share these direct signing links:
                      </p>
                      <div className="space-y-2">
                        {result.signingUrls.map((item) => (
                          <div
                            key={item.email}
                            className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                          >
                            <span className="text-sm text-white">{item.email}</span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Form state
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Request E-Signature
                    </h3>
                    <button
                      onClick={handleClose}
                      className="p-1 text-gray-400 hover:text-white rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Document info */}
                    <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                      <FileSignature className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{documentName}</p>
                        <p className="text-xs text-gray-500">Document to be signed</p>
                      </div>
                    </div>

                    {/* Recipients */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Recipients
                      </label>
                      <div className="space-y-2">
                        {recipients.map((recipient, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Name"
                              value={recipient.name}
                              onChange={(e) =>
                                updateRecipient(index, "name", e.target.value)
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500"
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={recipient.email}
                              onChange={(e) =>
                                updateRecipient(index, "email", e.target.value)
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500"
                            />
                            {recipients.length > 1 && (
                              <button
                                onClick={() => removeRecipient(index)}
                                className="p-2 text-gray-400 hover:text-red-400 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addRecipient}
                        className="mt-2 flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add recipient
                      </button>
                    </div>

                    {/* Email subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>

                    {/* Email body */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Message (optional)
                      </label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={3}
                        placeholder="Add a personal message..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? "Sending..." : "Send Request"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Status badge component for signature requests
export function SignatureStatus({ status }: { status: string }) {
  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    sent: { icon: Clock, color: "text-yellow-400 bg-yellow-500/20", label: "Pending" },
    delivered: { icon: Clock, color: "text-blue-400 bg-blue-500/20", label: "Delivered" },
    completed: { icon: CheckCircle, color: "text-green-400 bg-green-500/20", label: "Completed" },
    declined: { icon: XCircle, color: "text-red-400 bg-red-500/20", label: "Declined" },
    voided: { icon: XCircle, color: "text-gray-400 bg-gray-500/20", label: "Voided" },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
