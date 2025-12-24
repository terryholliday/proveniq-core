"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  BarChart3,
  Shield,
  Activity,
  Key,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: { key: string; label: string; type: string }[];
  filters?: { key: string; label: string; type: string; options?: { value: string; label: string }[] }[];
}

interface ReportData {
  template: ReportTemplate;
  generatedAt: string;
  filters: Record<string, unknown>;
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  asset: BarChart3,
  verification: Shield,
  audit: Activity,
  analytics: Key,
  compliance: Shield,
};

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      toast.error("Failed to load report templates");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format: "json" | "csv" = "json") => {
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          filters,
          format,
        }),
      });

      if (format === "csv") {
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${selectedTemplate.id}-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("Report downloaded");
        } else {
          toast.error("Failed to download report");
        }
      } else {
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
          toast.success("Report generated");
        } else {
          toast.error("Failed to generate report");
        }
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) return "—";
    if (type === "date" && value) {
      return new Date(value as string).toLocaleDateString();
    }
    if (type === "currency" && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    if (type === "number" && typeof value === "number") {
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 mt-1">
          Generate and download reports for your organization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Report Templates
          </h2>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              templates.map((template) => {
                const Icon = CATEGORY_ICONS[template.category] || FileText;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <motion.button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setReport(null);
                      setFilters({});
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-cyan-500/20" : "bg-white/10"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected ? "text-cyan-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${
                            isSelected ? "text-cyan-400" : "text-white"
                          }`}
                        >
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${
                          isSelected ? "text-cyan-400" : "text-gray-600"
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Report Configuration & Results */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="space-y-6">
              {/* Filters */}
              {selectedTemplate.filters && selectedTemplate.filters.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.filters.map((filter) => (
                      <div key={filter.key}>
                        <label className="block text-xs text-gray-400 mb-1">
                          {filter.label}
                        </label>
                        {filter.type === "select" && filter.options ? (
                          <select
                            value={(filters[filter.key] as string) || ""}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                [filter.key]: e.target.value || undefined,
                              })
                            }
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          >
                            <option value="">All</option>
                            {filter.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : filter.type === "date-range" ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dateRange: {
                                    ...(filters.dateRange as Record<string, string> || {}),
                                    start: e.target.value,
                                  },
                                })
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                            <input
                              type="date"
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dateRange: {
                                    ...(filters.dateRange as Record<string, string> || {}),
                                    end: e.target.value,
                                  },
                                })
                              }
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={(filters[filter.key] as string) || ""}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                [filter.key]: e.target.value || undefined,
                              })
                            }
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => generateReport("json")}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  <BarChart3 className="w-4 h-4" />
                  {generating ? "Generating..." : "Generate Report"}
                </button>
                <button
                  onClick={() => generateReport("csv")}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>

              {/* Results */}
              {report && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  {report.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(report.summary).map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <p className="text-xs text-gray-400 uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {typeof value === "number"
                              ? value.toLocaleString()
                              : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            {report.template.fields.map((field) => (
                              <th
                                key={field.key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                              >
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {report.data.length === 0 ? (
                            <tr>
                              <td
                                colSpan={report.template.fields.length}
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                No data available
                              </td>
                            </tr>
                          ) : (
                            report.data.slice(0, 50).map((row, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                {report.template.fields.map((field) => (
                                  <td
                                    key={field.key}
                                    className="px-4 py-3 text-sm text-gray-300"
                                  >
                                    {formatValue(row[field.key], field.type)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {report.data.length > 50 && (
                      <div className="px-4 py-3 border-t border-white/10 text-center text-sm text-gray-500">
                        Showing 50 of {report.data.length} rows. Download CSV for
                        full data.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a report template to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
