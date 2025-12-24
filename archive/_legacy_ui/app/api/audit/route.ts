import { NextRequest } from "next/server";
import { getAuditLogs, exportAuditLogs, EntityType, AuditAction } from "@/lib/audit";
import { apiGuard } from "@/lib/rbac/guards";
import { success, badRequest } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const guard = apiGuard("audit:read");
  const result = await guard(request);
  
  if (!result.allowed) {
    return result.response;
  }

  const searchParams = request.nextUrl.searchParams;
  
  const options = {
    userId: searchParams.get("userId") ?? undefined,
    organizationId: searchParams.get("organizationId") ?? undefined,
    entityType: searchParams.get("entityType") as EntityType | undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    action: searchParams.get("action") as AuditAction | undefined,
    startDate: searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined,
    endDate: searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined,
    limit: searchParams.get("limit") 
      ? parseInt(searchParams.get("limit")!, 10) 
      : 50,
    offset: searchParams.get("offset") 
      ? parseInt(searchParams.get("offset")!, 10) 
      : 0,
  };

  const logs = await getAuditLogs(options);
  return success(logs);
}

export async function POST(request: NextRequest) {
  const guard = apiGuard("audit:export");
  const result = await guard(request);
  
  if (!result.allowed) {
    return result.response;
  }

  try {
    const body = await request.json();
    
    if (!body.startDate || !body.endDate) {
      return badRequest("startDate and endDate are required");
    }

    const logs = await exportAuditLogs({
      organizationId: body.organizationId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });

    return success({
      logs,
      count: logs.length,
      exportedAt: new Date().toISOString(),
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
