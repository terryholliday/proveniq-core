import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { REPORT_TEMPLATES } from "@/lib/reports/templates";
import { generateReport } from "@/lib/reports/generator";
import { hasPermission, Role } from "@/lib/rbac/roles";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (templateId) {
      // Return specific template
      const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // Return all templates
    return NextResponse.json({ templates: REPORT_TEMPLATES });
  } catch (error) {
    console.error("[Reports] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const userRole = (session.user.role || "USER") as Role;
    if (!hasPermission(userRole, "audit:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { templateId, organizationId, filters, format = "json" } = body;

    if (!templateId) {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

    // Verify organization access
    if (organizationId) {
      const membership = await db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: "Organization access denied" }, { status: 403 });
      }
    }

    const report = await generateReport({
      templateId,
      organizationId: organizationId || "",
      filters,
    });

    if (!report) {
      return NextResponse.json({ error: "Failed to generate report" }, { status: 400 });
    }

    if (format === "csv") {
      const csv = convertToCSV(report.data, report.template.fields);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${templateId}-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[Reports] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function convertToCSV(
  data: Record<string, unknown>[],
  fields: { key: string; label: string }[]
): string {
  if (data.length === 0) return "";

  const headers = fields.map((f) => f.label).join(",");
  const rows = data.map((row) =>
    fields
      .map((f) => {
        const value = row[f.key];
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toISOString();
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
}
