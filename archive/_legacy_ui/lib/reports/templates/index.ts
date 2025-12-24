export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "asset" | "verification" | "audit" | "compliance" | "analytics";
  fields: ReportField[];
  filters?: ReportFilter[];
}

export interface ReportField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "currency";
  format?: string;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: "select" | "date-range" | "text" | "multi-select";
  options?: { value: string; label: string }[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "asset-inventory",
    name: "Asset Inventory Report",
    description: "Complete list of all registered assets with their current status",
    category: "asset",
    fields: [
      { key: "id", label: "Asset ID", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "type", label: "Type", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "value", label: "Value", type: "currency" },
      { key: "createdAt", label: "Created", type: "date" },
      { key: "lastVerified", label: "Last Verified", type: "date" },
    ],
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "PENDING", label: "Pending" },
          { value: "ARCHIVED", label: "Archived" },
        ],
      },
      { key: "dateRange", label: "Date Range", type: "date-range" },
    ],
  },
  {
    id: "verification-history",
    name: "Verification History Report",
    description: "Historical record of all asset verifications",
    category: "verification",
    fields: [
      { key: "id", label: "Verification ID", type: "string" },
      { key: "assetId", label: "Asset ID", type: "string" },
      { key: "assetName", label: "Asset Name", type: "string" },
      { key: "verifier", label: "Verifier", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "completedAt", label: "Completed", type: "date" },
    ],
    filters: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "PASSED", label: "Passed" },
          { value: "FAILED", label: "Failed" },
          { value: "PENDING", label: "Pending" },
        ],
      },
      { key: "dateRange", label: "Date Range", type: "date-range" },
    ],
  },
  {
    id: "audit-trail",
    name: "Audit Trail Report",
    description: "Complete audit log of all system activities",
    category: "audit",
    fields: [
      { key: "id", label: "Log ID", type: "string" },
      { key: "action", label: "Action", type: "string" },
      { key: "entityType", label: "Entity Type", type: "string" },
      { key: "entityId", label: "Entity ID", type: "string" },
      { key: "user", label: "User", type: "string" },
      { key: "ipAddress", label: "IP Address", type: "string" },
      { key: "createdAt", label: "Timestamp", type: "date" },
    ],
    filters: [
      { key: "action", label: "Action", type: "text" },
      { key: "entityType", label: "Entity Type", type: "text" },
      { key: "dateRange", label: "Date Range", type: "date-range" },
    ],
  },
  {
    id: "api-usage",
    name: "API Usage Report",
    description: "API key usage statistics and metrics",
    category: "analytics",
    fields: [
      { key: "keyName", label: "API Key", type: "string" },
      { key: "endpoint", label: "Endpoint", type: "string" },
      { key: "requests", label: "Requests", type: "number" },
      { key: "avgLatency", label: "Avg Latency (ms)", type: "number" },
      { key: "errorRate", label: "Error Rate (%)", type: "number" },
    ],
    filters: [
      { key: "dateRange", label: "Date Range", type: "date-range" },
    ],
  },
  {
    id: "compliance-summary",
    name: "Compliance Summary Report",
    description: "Overview of compliance status and data handling",
    category: "compliance",
    fields: [
      { key: "metric", label: "Metric", type: "string" },
      { key: "value", label: "Value", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "lastChecked", label: "Last Checked", type: "date" },
    ],
  },
];

export function getTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ReportTemplate["category"]): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category);
}
