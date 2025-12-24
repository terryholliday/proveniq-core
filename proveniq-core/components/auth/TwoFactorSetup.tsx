"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "backup" | "complete">("intro");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStartSetup() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
      
      if (!response.ok) {
        throw new Error("Failed to start 2FA setup");
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep("qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          token: verificationCode,
          backupCodes,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid verification code");
      }

      setStep("backup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    setStep("complete");
    onComplete?.();
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/10 rounded-lg">
      {step === "intro" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Enable Two-Factor Authentication
          </h2>
          <p className="text-gray-400 mb-6">
            Add an extra layer of security to your account by requiring a verification code in addition to your password.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-white/20 rounded text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cyan-500 rounded text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Get Started"}
            </button>
          </div>
        </motion.div>
      )}

      {step === "qr" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">
            Scan QR Code
          </h2>
          <p className="text-gray-400 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          
          <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
            {/* QR Code placeholder - in production, use a QR code library */}
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm text-center px-4">
                QR Code<br />
                <span className="text-xs">{qrCodeUrl.slice(0, 50)}...</span>
              </span>
            </div>
          </div>

          <div className="bg-black/50 p-3 rounded mb-4">
            <p className="text-xs text-gray-400 mb-1">Manual entry code:</p>
            <code className="text-cyan-400 text-sm break-all">{secret}</code>
          </div>

          <button
            onClick={() => setStep("verify")}
            className="w-full px-4 py-2 bg-cyan-500 rounded text-black font-medium hover:bg-cyan-400 transition-colors"
          >
            Continue
          </button>
        </motion.div>
      )}

      {step === "verify" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">
            Verify Setup
          </h2>
          <p className="text-gray-400 mb-4">
            Enter the 6-digit code from your authenticator app to verify setup.
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-3 text-center text-2xl tracking-widest font-mono text-white mb-4"
            maxLength={6}
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("qr")}
              className="flex-1 px-4 py-2 border border-white/20 rounded text-gray-300 hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-cyan-500 rounded text-black font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </motion.div>
      )}

      {step === "backup" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">
            Save Backup Codes
          </h2>
          <p className="text-gray-400 mb-4">
            Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
          </p>

          <div className="bg-black/50 p-4 rounded mb-4 grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code key={index} className="text-cyan-400 font-mono text-sm">
                {code}
              </code>
            ))}
          </div>

          <p className="text-yellow-400 text-sm mb-4">
            ⚠️ Each code can only be used once. Store them securely!
          </p>

          <button
            onClick={handleComplete}
            className="w-full px-4 py-2 bg-cyan-500 rounded text-black font-medium hover:bg-cyan-400 transition-colors"
          >
            I&apos;ve Saved My Codes
          </button>
        </motion.div>
      )}

      {step === "complete" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            2FA Enabled!
          </h2>
          <p className="text-gray-400">
            Your account is now protected with two-factor authentication.
          </p>
        </motion.div>
      )}
    </div>
  );
}
