"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
      <Link
        href="/"
        className="flex items-center hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        
        // Format segment: replace hyphens/underscores with spaces and capitalize
        const label = segment
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <Fragment key={href}>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-600" />
            {isLast ? (
              <span className="text-white font-medium" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-white transition-colors"
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
