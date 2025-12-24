"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROVENIQ_DNA } from "@/lib/config";
import type { ProductModule } from "@/lib/config";
import {
  LayoutGrid,
  ShieldCheck,
  FileText,
  Gavel,
  Cpu,
  Landmark,
  Box,
  Radio,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping based on role/ID
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: LayoutGrid,
  ledger: ShieldCheck,
  "claims-iq": FileText,
  bids: Gavel,
  core: Cpu,
  capital: Landmark,
  locker: Box,
  "smart-tag": Radio,
};

export function AppSidebar() {
  const pathname = usePathname();

  // Group by Type
  const software = PROVENIQ_DNA.products.filter((p) => p.type === "Software");
  const infra = PROVENIQ_DNA.products.filter((p) => p.type === "Infrastructure");
  const hardware = PROVENIQ_DNA.products.filter((p) => p.type === "Hardware");

  const NavGroup = ({
    title,
    items,
  }: {
    title: string;
    items: readonly ProductModule[];
  }) => (
    <div className="mb-6">
      <h3 className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.id] || Box;
          const href =
            item.type === "Hardware"
              ? `/hardware/${item.routeSlug}`
              : `/products/${item.routeSlug}`;
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-proveniq-accent/10 text-proveniq-accent border-r-2 border-proveniq-accent"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-proveniq-accent" : "text-slate-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 border-r border-white/5 bg-background h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-proveniq-accent rounded-sm flex items-center justify-center font-bold text-slate-950 text-xs">
            P
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Proveniq
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <NavGroup title="Software Suite" items={software} />
        <NavGroup title="Infrastructure" items={infra} />
        <NavGroup title="Hardware Layer" items={hardware} />

        <div className="mt-8 pt-6 border-t border-white/5">
          <Link
            href="/bible"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Investor Bible
          </Link>
        </div>
      </div>
    </aside>
  );
}
