import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { search } from "@/lib/search/index";
import { getAuthContext } from "@/lib/rbac/guards";
import { success, unauthorized, badRequest, forbidden } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get("organizationId");
  const query = searchParams.get("q");
  const entityType = searchParams.get("type") || undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!organizationId) return badRequest("Organization ID required");
  if (!query) return success([]); // Return empty array if no query

  // Check permissions
  const context = await getAuthContext(organizationId);
  if (!context || !context.orgRole) return forbidden();

  const results = await search({
    organizationId,
    query,
    entityType,
    limit,
    offset,
  });

  return success(results);
}
