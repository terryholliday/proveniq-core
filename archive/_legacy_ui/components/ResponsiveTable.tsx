"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  className,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-gray-400",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-white/5 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-sm text-gray-300",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={cn("md:hidden space-y-3", className)}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(
              "bg-white/5 border border-white/10 rounded-lg p-4",
              onRowClick && "cursor-pointer hover:bg-white/10 transition-colors"
            )}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col, index) => (
                <div
                  key={col.key}
                  className={cn(
                    "flex justify-between items-start",
                    index > 0 && "mt-2 pt-2 border-t border-white/5"
                  )}
                >
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </span>
                  <span className="text-sm text-gray-300 text-right">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? "")}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
