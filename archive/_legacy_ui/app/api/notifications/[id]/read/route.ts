import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markAsRead } from "@/lib/notifications";
import { success, unauthorized, badRequest } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  
  if (!id) {
    return badRequest("Notification ID is required");
  }

  await markAsRead(id, session.user.id);
  
  return success({ success: true });
}
