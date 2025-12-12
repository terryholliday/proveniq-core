"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROVENIQ_DNA } from "@/lib/config";
import { LAYOUT } from "@/lib/physics";
import { motion } from "framer-motion";

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800"
            style={{ width: LAYOUT.sidebarWidth }}
        >
            <div className="flex items-center h-16 px-6 border-b border-slate-800">
                <span className="text-lg font-bold tracking-tight text-white">
                    PROVENIQ
                </span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                {/* Software Section */}
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Software
                    </h3>
                    <ul className="space-y-1">
                        {PROVENIQ_DNA.products
                            .filter((p) => p.type === "Software")
                            .map((product) => {
                                const isActive = pathname.startsWith(`/products/${product.routeSlug}`);
                                return (
                                    <li key={product.id}>
                                        <Link
                                            href={`/products/${product.routeSlug}`}
                                            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? "bg-slate-800 text-sky-500"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                }`}
                                        >
                                            {product.label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                    </ul>
                </div>

                {/* Infrastructure Section */}
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Infrastructure
                    </h3>
                    <ul className="space-y-1">
                        {PROVENIQ_DNA.products
                            .filter((p) => p.type === "Infrastructure")
                            .map((product) => {
                                const isActive = pathname.startsWith(`/products/${product.routeSlug}`);
                                return (
                                    <li key={product.id}>
                                        <Link
                                            href={`/products/${product.routeSlug}`}
                                            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? "bg-slate-800 text-sky-500"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                }`}
                                        >
                                            {product.label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                    </ul>
                </div>

                {/* Hardware Section */}
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Hardware
                    </h3>
                    <ul className="space-y-1">
                        {PROVENIQ_DNA.products
                            .filter((p) => p.type === "Hardware")
                            .map((product) => {
                                const isActive = pathname.startsWith(`/hardware/${product.routeSlug}`);
                                return (
                                    <li key={product.id}>
                                        <Link
                                            href={`/hardware/${product.routeSlug}`}
                                            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? "bg-slate-800 text-sky-500"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                }`}
                                        >
                                            {product.label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500"
                                                />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                    </ul>
                </div>

                {/* Training Section */}
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Training
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="/academy"
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${pathname.startsWith('/academy')
                                    ? "bg-amber-950/20 text-amber-500"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    }`}
                            >
                                Flight School
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/docs/manual"
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${pathname.startsWith('/docs')
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    }`}
                            >
                                Operator's Manual
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* User Profile Stub (Bottom) */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Architect</p>
                        <p className="text-xs text-slate-500 truncate">System Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
```
