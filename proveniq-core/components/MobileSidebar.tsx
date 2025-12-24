"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROVENIQ_DNA } from "@/lib/config";
import type { ProductType } from "@/lib/types";
import {
  Home,
  BookOpen,
  ShieldCheck,
  Gavel,
  Cpu,
  Landmark,
  Lock,
  Radio,
  LucideIcon,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  ledger: BookOpen,
  "claims-iq": ShieldCheck,
  bids: Gavel,
  core: Cpu,
  capital: Landmark,
  locker: Lock,
  "smart-tag": Radio,
};

const CATEGORY_ORDER: ProductType[] = ["Software", "Infrastructure", "Hardware"];

function groupByType() {
  const grouped: Record<ProductType, typeof PROVENIQ_DNA.products[number][]> = {
    Software: [],
    Infrastructure: [],
    Hardware: [],
  };

  for (const product of PROVENIQ_DNA.products) {
    grouped[product.type as ProductType].push(product);
  }

  return grouped;
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const grouped = groupByType();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button - only visible on small screens */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/80 border border-white/10 rounded-lg text-white"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-black border-r border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-proveniq-accent flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="font-semibold text-lg text-white">Proveniq</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-6">
                  {CATEGORY_ORDER.map((category) => {
                    const products = grouped[category];
                    if (products.length === 0) return null;

                    return (
                      <div key={category} className="flex flex-col gap-1">
                        <span className="px-3 text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                          {category}
                        </span>
                        {products.map((product) => {
                          const Icon = ICON_MAP[product.id] || Cpu;
                          const href = `/${product.routeSlug}`;
                          const isActive = pathname === href || pathname?.startsWith(`${href}/`);

                          return (
                            <Link
                              key={product.id}
                              href={href}
                              className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : "text-gray-400 hover:text-white hover:bg-white/10"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{product.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
