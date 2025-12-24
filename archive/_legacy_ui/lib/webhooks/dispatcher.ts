import { db } from "@/lib/db";
import { signPayload } from "./signature";

export type DeliveryStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";

export interface WebhookEvent {
  event: string;
  payload: Record<string, unknown>;
  organizationId: string;
}

export async function dispatchWebhook(event: WebhookEvent) {
  const { event: eventName, payload, organizationId } = event;

  // Find active webhooks for this organization that subscribe to this event
  const webhooks = await db.webhook.findMany({
    where: {
      organizationId,
      isActive: true,
      events: {
        has: eventName,
      },
    },
  });

  if (webhooks.length === 0) {
    return;
  }

  const payloadString = JSON.stringify(payload);

  // Process webhooks in parallel
  await Promise.all(
    webhooks.map(async (webhook) => {
      const signature = signPayload(payloadString, webhook.secret);
      
      // Create delivery record
      const delivery = await db.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: eventName,
          payload: payload as any,
          status: "PENDING",
        },
      });

      try {
        const startTime = Date.now();
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Proveniq-Event": eventName,
            "X-Proveniq-Signature": signature,
            "X-Proveniq-Delivery-ID": delivery.id,
          },
          body: payloadString,
          // Timeout after 10s
          signal: AbortSignal.timeout(10000),
        });

        const endTime = Date.now();
        const responseBody = await response.text();

        await db.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: response.ok ? "SUCCESS" : "FAILED",
            statusCode: response.status,
            responseBody: responseBody.slice(0, 1000), // Truncate if too long
            deliveredAt: new Date(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        await db.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            responseBody: errorMessage,
            attempts: 1,
          },
        });
      }
    })
  );
}

export async function retryDelivery(deliveryId: string) {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  });

  if (!delivery || !delivery.webhook) {
    throw new Error("Delivery or webhook not found");
  }

  const payloadString = JSON.stringify(delivery.payload);
  const signature = signPayload(payloadString, delivery.webhook.secret);

  try {
    const response = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Proveniq-Event": delivery.event,
        "X-Proveniq-Signature": signature,
        "X-Proveniq-Delivery-ID": delivery.id,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await response.text();

    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: response.ok ? "SUCCESS" : "FAILED",
        statusCode: response.status,
        responseBody: responseBody.slice(0, 1000),
        deliveredAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return response.ok;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        responseBody: errorMessage,
        attempts: { increment: 1 },
      },
    });
    
    return false;
  }
}
