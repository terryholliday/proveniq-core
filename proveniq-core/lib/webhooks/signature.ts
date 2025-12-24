import { createHmac, timingSafeEqual } from "crypto";

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signPayload(payload, secret);
  
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
