"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, FileText, Box, Shield, File } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce"; // We might need to create this hook if it doesn't exist
import Link from "next/link";

interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
}

interface SearchProps {
  organizationId: string;
}

export function Search({ organizationId }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Simple debounce implementation inside component to avoid dependency
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  async function performSearch() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?organizationId=${organizationId}&q=${encodeURIComponent(debouncedQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "asset": return <Box className="w-4 h-4 text-cyan-400" />;
      case "document": return <File className="w-4 h-4 text-purple-400" />;
      case "verification": return <Shield className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLink = (result: SearchResult) => {
    switch (result.entityType) {
      case "asset": return `/assets/${result.entityId}`;
      case "document": return `/vault?highlight=${result.entityId}`;
      default: return "#";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors w-64"
      >
        <SearchIcon className="w-4 h-4" />
        <span>Search...</span>
        <span className="ml-auto text-xs border border-white/10 px-1.5 rounded bg-black/50">
          ⌘K
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-black border border-white/20 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search assets, documents, and more..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-2">
                    {results.map((result) => (
                      <Link
                        key={result.id}
                        href={getLink(result)}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                      >
                        <div className="mt-1">{getIcon(result.entityType)}</div>
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {result.title}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {result.content}
                          </p>
                        </div>
                        <div className="ml-auto text-xs text-gray-600 capitalize">
                          {result.entityType}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : query.trim().length > 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No results found for "{query}"
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Search for assets, documents, verifications...
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-white/10 bg-white/5 text-xs text-gray-500 flex justify-end gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="bg-black border border-white/20 rounded px-1">↓</kbd>
                  <kbd className="bg-black border border-white/20 rounded px-1">↑</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-black border border-white/20 rounded px-1">↵</kbd>
                  to select
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
