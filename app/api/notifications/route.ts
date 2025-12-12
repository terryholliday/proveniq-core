import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserNotifications } from "@/lib/notifications";
import { success, unauthorized } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return unauthorized();
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const notifications = await getUserNotifications(session.user.id, limit, offset);
  
  return success(notifications);
}
