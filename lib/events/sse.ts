// Server-Sent Events connection manager

// Store active connections per user
export const connections = new Map<string, Set<ReadableStreamDefaultController>>();

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
