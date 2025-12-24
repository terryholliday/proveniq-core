"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Copy,
  Download,
  History,
  Book,
  Settings,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface QueryHistoryItem {
  id: string;
  query: string;
  variables: string;
  timestamp: Date;
}

const EXAMPLE_QUERIES = [
  {
    name: "Get Current User",
    query: `query Me {
  me {
    id
    email
    name
    role
    organizations {
      organization {
        id
        name
      }
      role
    }
  }
}`,
    variables: "{}",
  },
  {
    name: "List Assets",
    query: `query Assets($organizationId: ID!, $limit: Int) {
  assets(organizationId: $organizationId, limit: $limit) {
    edges {
      node {
        id
        name
        category
        status
        createdAt
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}`,
    variables: '{\n  "organizationId": "your-org-id",\n  "limit": 10\n}',
  },
  {
    name: "Create Asset",
    query: `mutation CreateAsset($input: CreateAssetInput!) {
  createAsset(input: $input) {
    id
    name
    category
    status
    createdAt
  }
}`,
    variables: `{
  "input": {
    "organizationId": "your-org-id",
    "name": "New Asset",
    "category": "equipment"
  }
}`,
  },
  {
    name: "Get Notifications",
    query: `query Notifications($unreadOnly: Boolean, $limit: Int) {
  notifications(unreadOnly: $unreadOnly, limit: $limit) {
    edges {
      node {
        id
        type
        title
        message
        readAt
        createdAt
      }
    }
    pageInfo {
      totalCount
    }
  }
  unreadNotificationCount
}`,
    variables: '{\n  "unreadOnly": true,\n  "limit": 20\n}',
  },
];

export default function GraphQLPlaygroundPage() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].query);
  const [variables, setVariables] = useState(EXAMPLE_QUERIES[0].variables);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [showVariables, setShowVariables] = useState(true);
  const queryRef = useRef<HTMLTextAreaElement>(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult("");

    try {
      let parsedVariables = {};
      if (variables.trim()) {
        try {
          parsedVariables = JSON.parse(variables);
        } catch {
          throw new Error("Invalid JSON in variables");
        }
      }

      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: parsedVariables,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

      // Add to history
      const historyItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query,
        variables,
        timestamp: new Date(),
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 20));

      if (data.errors) {
        setError(data.errors[0]?.message || "GraphQL error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      setResult(JSON.stringify({ error: message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graphql-result-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = (example: (typeof EXAMPLE_QUERIES)[0]) => {
    setQuery(example.query);
    setVariables(example.variables);
  };

  const loadFromHistory = (item: QueryHistoryItem) => {
    setQuery(item.query);
    setVariables(item.variables);
    setShowHistory(false);
  };

  // Keyboard shortcut: Ctrl/Cmd + Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        executeQuery();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, variables]);

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">GraphQL Playground</h1>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
            /api/graphql
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showHistory
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showExamples
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Book className="w-4 h-4" />
            Examples
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {(showHistory || showExamples) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/10 overflow-y-auto"
          >
            {showExamples && (
              <div className="p-4">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Example Queries
                </h3>
                <div className="space-y-2">
                  {EXAMPLE_QUERIES.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => loadExample(example)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showHistory && history.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Recent Queries
                </h3>
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="truncate font-mono text-xs">
                        {item.query.split("\n")[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Query Editor */}
          <div className="flex-1 flex flex-col border-r border-white/10">
            {/* Query */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Query
                </span>
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 text-black text-sm font-medium rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run
                </button>
              </div>
              <textarea
                ref={queryRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 w-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                placeholder="Enter your GraphQL query..."
                spellCheck={false}
              />
            </div>

            {/* Variables */}
            <div className="border-t border-white/10">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:bg-white/5"
              >
                {showVariables ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Variables
              </button>
              {showVariables && (
                <textarea
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  className="w-full h-32 p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none border-t border-white/5"
                  placeholder='{"key": "value"}'
                  spellCheck={false}
                />
              )}
            </div>
          </div>

          {/* Result */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Result
                </span>
                {result && !loading && (
                  error ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )
                )}
              </div>
              {result && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyResult}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadResult}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : result ? (
                <pre
                  className={`font-mono text-sm whitespace-pre-wrap ${
                    error ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {result}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Press Ctrl+Enter or click Run to execute
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-500 flex items-center justify-between">
        <span>Ctrl+Enter to execute</span>
        <span>GraphQL Yoga</span>
      </div>
    </div>
  );
}
