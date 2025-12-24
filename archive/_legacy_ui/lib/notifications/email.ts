import { db } from "@/lib/db";

// Placeholder for email service (e.g., AWS SES, Resend, SendGrid)
// For now, we'll just log to console and simulate success

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement actual email sending logic
  console.log("---------------------------------------------------");
  console.log(`Sending Email to: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log("Content Preview:", options.text || options.html.substring(0, 100));
  console.log("---------------------------------------------------");

  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return true;
}

export async function sendVerificationEmail(userId: string, token: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.email) return false;

  const verificationLink = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: "Verify your Proveniq account",
    html: `
      <h1>Welcome to Proveniq</h1>
      <p>Please click the link below to verify your account:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
    text: `Welcome to Proveniq. Please verify your account: ${verificationLink}`,
  });
}

export async function sendNotificationEmail(userId: string, title: string, message: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.email) return false;

  return sendEmail({
    to: user.email,
    subject: `Notification: ${title}`,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
      <hr />
      <p style="font-size: 12px; color: #666;">You are receiving this because you enabled email notifications.</p>
    `,
    text: `${title}\n\n${message}`,
  });
}
