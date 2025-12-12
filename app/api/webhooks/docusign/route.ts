import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/esign/request";
import crypto from "crypto";

// DocuSign webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("base64");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-docusign-signature-1") || "";
    const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error("[DocuSign Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(payload);

    // DocuSign Connect sends envelope status updates
    // Structure varies based on configuration
    const envelopeId = data.envelopeId || data.data?.envelopeId;
    const status = data.status || data.data?.envelopeSummary?.status;
    const event = data.event || "envelope-status-changed";

    if (!envelopeId) {
      console.error("[DocuSign Webhook] Missing envelopeId");
      return NextResponse.json({ error: "Missing envelopeId" }, { status: 400 });
    }

    // Extract recipient statuses if available
    const recipientStatuses = data.data?.envelopeSummary?.recipients?.signers?.map(
      (signer: any) => ({
        email: signer.email,
        status: signer.status,
        signedDateTime: signer.signedDateTime,
      })
    );

    await handleWebhookEvent({
      event,
      envelopeId,
      status,
      recipientStatuses,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[DocuSign Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
