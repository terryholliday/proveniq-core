import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store active connections per user
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the user's set
      if (!connections.has(userId)) {
        connections.set(userId, new Set());
      }
      connections.get(userId)!.add(controller);

      // Send initial connection message
      const data = JSON.stringify({ type: "connected", timestamp: Date.now() });
      controller.enqueue(`data: ${data}\n\n`);

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        connections.get(userId)?.delete(controller);
        if (connections.get(userId)?.size === 0) {
          connections.delete(userId);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Helper function to send events to a specific user
export function sendEventToUser(userId: string, event: { type: string; data: unknown }) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = JSON.stringify(event);
  
  for (const controller of userConnections) {
    try {
      controller.enqueue(`data: ${message}\n\n`);
    } catch {
      userConnections.delete(controller);
    }
  }
}

// Helper function to broadcast to all connected users
export function broadcastEvent(event: { type: string; data: unknown }) {
  const message = JSON.stringify(event);
  
  for (const [, userConnections] of connections) {
    for (const controller of userConnections) {
      try {
        controller.enqueue(`data: ${message}\n\n`);
      } catch {
        userConnections.delete(controller);
      }
    }
  }
}
