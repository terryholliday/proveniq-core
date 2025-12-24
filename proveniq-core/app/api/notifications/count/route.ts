import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { success, unauthorized } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return unauthorized();
  }

  const count = await getUnreadCount(session.user.id);
  
  return success({ count });
}
