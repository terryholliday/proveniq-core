// WebSocket Server for Real-time Features
// Note: Next.js App Router doesn't natively support WebSockets
// This module provides utilities for WebSocket integration with external servers

import { Server as HTTPServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

// Store active connections
const clients = new Map<string, Set<AuthenticatedWebSocket>>();

export function createWebSocketServer(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Authenticate connection
    // In production, extract token from query string or cookie
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Authentication required");
      return;
    }

    // Validate token and get user ID
    // This is a placeholder - implement actual token validation
    const userId = await validateToken(token);
    if (!userId) {
      ws.close(4001, "Invalid token");
      return;
    }

    ws.userId = userId;

    // Add to clients map
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(ws);

    // Send connection confirmation
    sendToClient(ws, {
      type: "connected",
      data: { userId },
      timestamp: Date.now(),
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (error) {
        console.error("[WebSocket] Invalid message:", error);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        clients.get(ws.userId)?.delete(ws);
        if (clients.get(ws.userId)?.size === 0) {
          clients.delete(ws.userId);
        }
      }
    });

    ws.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
    });
  });

  return wss;
}

async function validateToken(token: string): Promise<string | null> {
  // Implement token validation
  // This could verify a JWT, session token, or API key
  // For now, return null to indicate validation should be implemented
  console.warn("[WebSocket] Token validation not implemented");
  return null;
}

function handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
  switch (message.type) {
    case "ping":
      sendToClient(ws, { type: "pong", data: null, timestamp: Date.now() });
      break;

    case "subscribe":
      // Handle channel subscriptions
      console.log(`[WebSocket] User ${ws.userId} subscribed to:`, message.data);
      break;

    case "unsubscribe":
      // Handle channel unsubscriptions
      console.log(`[WebSocket] User ${ws.userId} unsubscribed from:`, message.data);
      break;

    default:
      console.log(`[WebSocket] Unknown message type: ${message.type}`);
  }
}

function sendToClient(ws: WebSocket, message: WebSocketMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Public API for sending messages

export function sendToUser(userId: string, message: Omit<WebSocketMessage, "timestamp">) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const fullMessage: WebSocketMessage = {
    ...message,
    timestamp: Date.now(),
  };

  for (const client of userClients) {
    sendToClient(client, fullMessage);
  }
}

export function broadcast(message: Omit<WebSocketMessage, "timestamp">) {
  const fullMessage: WebSocketMessage = {
    ...message,
    timestamp: Date.now(),
  };

  for (const [, userClients] of clients) {
    for (const client of userClients) {
      sendToClient(client, fullMessage);
    }
  }
}

export function sendToUsers(userIds: string[], message: Omit<WebSocketMessage, "timestamp">) {
  for (const userId of userIds) {
    sendToUser(userId, message);
  }
}

export function getConnectedUsers(): string[] {
  return Array.from(clients.keys());
}

export function isUserConnected(userId: string): boolean {
  return clients.has(userId) && clients.get(userId)!.size > 0;
}

export function getConnectionCount(): number {
  let count = 0;
  for (const [, userClients] of clients) {
    count += userClients.size;
  }
  return count;
}

// Event emitter pattern for internal use
type EventHandler = (data: unknown) => void;
const eventHandlers = new Map<string, Set<EventHandler>>();

export function on(event: string, handler: EventHandler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event)!.add(handler);
}

export function off(event: string, handler: EventHandler) {
  eventHandlers.get(event)?.delete(handler);
}

export function emit(event: string, data: unknown) {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] Event handler error for ${event}:`, error);
      }
    }
  }
}
