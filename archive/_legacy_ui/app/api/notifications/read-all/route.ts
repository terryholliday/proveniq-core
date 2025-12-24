import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markAllAsRead } from "@/lib/notifications";
import { success, unauthorized } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return unauthorized();
  }

  await markAllAsRead(session.user.id);
  
  return success({ success: true });
}
