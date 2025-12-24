"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_HEAVY } from "@/lib/physics";

interface ApiConsoleProps {
  className?: string;
  autoType?: boolean;
}

const REQUEST_CODE = `POST /api/v1/verify HTTP/1.1
Host: core.proveniq.io
Authorization: Bearer sk_live_***
Content-Type: application/json

{
  "asset_id": "ast_7xK9mPqR2nL4",
  "verification_type": "ownership",
  "evidence": {
    "capture_id": "cap_3vN8wYtQ1hJ6",
    "timestamp": "2024-12-12T07:25:00Z"
  }
}`;

const RESPONSE_CODE = `HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: req_9bM2kLpS4wE7

{
  "status": "verified",
  "asset_id": "ast_7xK9mPqR2nL4",
  "verification": {
    "type": "ownership",
    "confidence": 0.97,
    "evidence_hash": "sha256:e3b0c44...",
    "verified_at": "2024-12-12T07:25:01Z"
  },
  "metadata": {
    "latency_ms": 142,
    "model_version": "v2.4.1"
  }
}`;

function highlightSyntax(code: string): React.ReactNode[] {
  const lines = code.split("\n");

  return lines.map((line, i) => {
    if (line.startsWith("POST") || line.startsWith("HTTP")) {
      const parts = line.split(" ");
      return (
        <div key={i} className="leading-6">
          <span className="text-pink-400">{parts[0]}</span>
          <span className="text-emerald-400"> {parts[1]}</span>
          <span className="text-slate-500"> {parts.slice(2).join(" ")}</span>
        </div>
      );
    }

    if (line.includes(":") && !line.trim().startsWith("{") && !line.trim().startsWith("}") && !line.trim().startsWith('"')) {
      const [key, ...rest] = line.split(":");
      return (
        <div key={i} className="leading-6">
          <span className="text-sky-400">{key}</span>
          <span className="text-slate-400">:</span>
          <span className="text-amber-300">{rest.join(":")}</span>
        </div>
      );
    }

    if (line.trim().startsWith('"')) {
      const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)$/);
      if (keyMatch) {
        return (
          <div key={i} className="leading-6">
            <span>{keyMatch[1]}</span>
            <span className="text-sky-300">"{keyMatch[2]}"</span>
            <span className="text-slate-400">{keyMatch[3]}</span>
            <span className={keyMatch[4].includes('"') ? "text-emerald-400" : "text-amber-300"}>
              {keyMatch[4]}
            </span>
          </div>
        );
      }
    }

    if (line.trim() === "{" || line.trim() === "}" || line.trim() === "},") {
      return <div key={i} className="leading-6 text-slate-500">{line}</div>;
    }

    return <div key={i} className="leading-6 text-slate-300">{line}</div>;
  });
}

export function ApiConsole({ className = "", autoType = true }: ApiConsoleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayedRequest, setDisplayedRequest] = useState(autoType ? "" : REQUEST_CODE);
  const [displayedResponse, setDisplayedResponse] = useState(autoType ? "" : RESPONSE_CODE);
  const [phase, setPhase] = useState<"typing" | "waiting" | "response" | "done">(
    autoType ? "typing" : "done"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!autoType || prefersReducedMotion || !mounted) {
      setDisplayedRequest(REQUEST_CODE);
      setDisplayedResponse(RESPONSE_CODE);
      setPhase("done");
      return;
    }

    let requestIndex = 0;
    let responseIndex = 0;

    const typeRequest = () => {
      if (requestIndex <= REQUEST_CODE.length) {
        setDisplayedRequest(REQUEST_CODE.slice(0, requestIndex));
        requestIndex++;
        setTimeout(typeRequest, 15);
      } else {
        setPhase("waiting");
        setTimeout(() => {
          setPhase("response");
          typeResponse();
        }, 800);
      }
    };

    const typeResponse = () => {
      if (responseIndex <= RESPONSE_CODE.length) {
        setDisplayedResponse(RESPONSE_CODE.slice(0, responseIndex));
        responseIndex++;
        setTimeout(typeResponse, 10);
      } else {
        setPhase("done");
      }
    };

    const timeout = setTimeout(typeRequest, 500);
    return () => clearTimeout(timeout);
  }, [autoType, prefersReducedMotion, mounted]);

  if (!mounted) {
    return <div className={`rounded-lg bg-slate-900 ${className}`} style={{ height: 400 }} />;
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-slate-800 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-xs text-slate-500 font-mono">
            core.proveniq.io — POST /api/v1/verify
          </span>
        </div>
        <div className="w-14" />
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-800">
        <div className="bg-[#1e1e1e] p-4 min-h-[350px]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Request
            </span>
            {phase === "typing" && (
              <motion.span
                className="w-2 h-4 bg-proveniq-accent"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>
          <pre className="text-xs font-mono overflow-auto">
            <code>{highlightSyntax(displayedRequest)}</code>
          </pre>
        </div>

        <div className="bg-[#1e1e1e] p-4 min-h-[350px]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Response
            </span>
            {phase === "waiting" && (
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </motion.div>
            )}
            {phase === "response" && (
              <motion.span
                className="w-2 h-4 bg-emerald-500"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
            {phase === "done" && displayedResponse && (
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                200 OK
              </span>
            )}
          </div>
          <pre className="text-xs font-mono overflow-auto">
            <code>{highlightSyntax(displayedResponse)}</code>
          </pre>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Latency:</span>
            <span className="text-xs font-mono text-proveniq-success">142ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Confidence:</span>
            <span className="text-xs font-mono text-proveniq-success">97%</span>
          </div>
        </div>
        <span className="text-xs text-slate-600 font-mono">v2.4.1</span>
      </div>
    </div>
  );
}
