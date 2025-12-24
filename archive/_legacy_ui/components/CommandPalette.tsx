"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search as SearchIcon, 
  X, 
  FileText, 
  Box, 
  Shield, 
  File, 
  Home, 
  Settings, 
  Lock, 
  Activity, 
  CreditCard 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
}

interface CommandPaletteProps {
  organizationId?: string | null;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

interface CommandItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

export function CommandPalette({ organizationId }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  // Static commands
  const staticCommands: CommandGroup[] = [
    {
      heading: "Navigation",
      items: [
        { id: "nav-home", title: "Home", icon: <Home className="w-4 h-4" />, href: "/" },
        { id: "nav-vault", title: "Document Vault", icon: <Lock className="w-4 h-4" />, href: "/vault" },
        { id: "nav-audit", title: "Audit Logs", icon: <FileText className="w-4 h-4" />, href: "/admin/audit" },
        { id: "nav-webhooks", title: "Webhooks", icon: <Activity className="w-4 h-4" />, href: "/settings/webhooks" },
        { id: "nav-settings", title: "Settings", icon: <Settings className="w-4 h-4" />, href: "/settings" },
      ],
    },
  ];

  const [filteredCommands, setFilteredCommands] = useState<CommandGroup[]>(staticCommands);

  // Debounce for API search
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Handle keyboard shortcuts
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

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter static commands locally
  useEffect(() => {
    if (!query) {
      setFilteredCommands(staticCommands);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = staticCommands.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
      )
    })).filter(group => group.items.length > 0);

    setFilteredCommands(filtered);
  }, [query]);

  // Perform API search
  useEffect(() => {
    if (debouncedQuery.trim().length > 0 && organizationId) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, organizationId]);

  async function performSearch() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?organizationId=${organizationId}&q=${encodeURIComponent(debouncedQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems = filteredCommands.reduce((acc, group) => acc + group.items.length, 0) + searchResults.length;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeSelectedItem();
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [isOpen, filteredCommands, searchResults, selectedIndex]);

  function executeSelectedItem() {
    let currentIndex = 0;
    
    // Check static commands
    for (const group of filteredCommands) {
      for (const item of group.items) {
        if (currentIndex === selectedIndex) {
          if (item.href) {
            router.push(item.href);
          } else if (item.action) {
            item.action();
          }
          setIsOpen(false);
          return;
        }
        currentIndex++;
      }
    }

    // Check search results
    for (const result of searchResults) {
      if (currentIndex === selectedIndex) {
        const link = getLink(result);
        router.push(link);
        setIsOpen(false);
        return;
      }
      currentIndex++;
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
        <span>Search or jump to...</span>
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
              className="relative w-full max-w-xl bg-black border border-white/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-2">
                {/* Static Commands */}
                {filteredCommands.map((group) => (
                  <div key={group.heading} className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.heading}
                    </div>
                    {group.items.map((item) => {
                      const isActive = selectedIndex === 
                        filteredCommands.slice(0, filteredCommands.indexOf(group)).reduce((acc, g) => acc + g.items.length, 0) + 
                        group.items.indexOf(item);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.href) router.push(item.href);
                            else item.action?.();
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => {
                            // Calculate index
                            const idx = filteredCommands.slice(0, filteredCommands.indexOf(group)).reduce((acc, g) => acc + g.items.length, 0) + 
                              group.items.indexOf(item);
                            setSelectedIndex(idx);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                            isActive ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          {item.icon}
                          <span className="text-sm font-medium">{item.title}</span>
                          {isActive && <span className="ml-auto text-xs opacity-50">↵</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* API Search Results */}
                {loading && (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Searching records...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-white/5 pt-2 mt-2">
                      Search Results
                    </div>
                    {searchResults.map((result, idx) => {
                      const globalIndex = filteredCommands.reduce((acc, g) => acc + g.items.length, 0) + idx;
                      const isActive = selectedIndex === globalIndex;

                      return (
                        <Link
                          key={result.id}
                          href={getLink(result)}
                          onClick={() => setIsOpen(false)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                            isActive ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="mt-0.5">{getIcon(result.entityType)}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium truncate">
                              {result.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {result.content}
                            </p>
                          </div>
                          {isActive && <span className="ml-auto text-xs opacity-50">↵</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!loading && query && searchResults.length === 0 && filteredCommands.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No results found for "{query}"
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-white/10 bg-white/5 text-xs text-gray-500 flex justify-end gap-4 shrink-0">
                <span className="flex items-center gap-1">
                  <kbd className="bg-black border border-white/20 rounded px-1 min-w-[1.2em] text-center">↓</kbd>
                  <kbd className="bg-black border border-white/20 rounded px-1 min-w-[1.2em] text-center">↑</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-black border border-white/20 rounded px-1 min-w-[1.2em] text-center">↵</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-black border border-white/20 rounded px-1 min-w-[1.2em] text-center">esc</kbd>
                  to close
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
