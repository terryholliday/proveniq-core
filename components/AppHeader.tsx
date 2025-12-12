"use client";

import { useSession } from "next-auth/react";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function AppHeader() {
  const { data: session } = useSession();
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, we'd probably have an organization context or hook
    // For now, we'll fetch the user's first organization to enable search
    async function fetchDefaultOrg() {
      if (session?.user?.id && !organizationId) {
        try {
          // This endpoint doesn't exist yet in our minimal setup, 
          // but we can assume we might have a way to get user's orgs.
          // For this MVP, let's just use a placeholder or wait for a real context.
          // Or better, let's fetch from an endpoint we likely need.
          // We can reuse the tenant context logic if we move it to an API.
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchDefaultOrg();
  }, [session, organizationId]);

  return (
    <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* We can pass a specific org ID here if we have one from the route */}
        {/* For now, we'll render CommandPalette only if we have an ID, or we can make it handle null */}
        {organizationId ? (
          <CommandPalette organizationId={organizationId} />
        ) : (
          <div className="w-64 h-8 bg-white/5 rounded animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationCenter />
        
        <div className="h-8 w-px bg-white/10 mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-400">
              {session?.user?.email}
            </p>
          </div>
          
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-4 h-4" />
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="p-1">
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {/* Sign out logic */}}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
