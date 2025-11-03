/**
 * Email integration placeholder
 * This can be extended to use Resend, SendGrid, or Nodemailer
 */

type SendEmailPayload = {
  to: string;
  subject: string;
  body: string;
  html?: string;
};

export async function sendEmail({ to, subject, body, html }: SendEmailPayload) {
  // Placeholder implementation
  // In production, integrate with Resend API, SendGrid, or Nodemailer
  console.log(`[EMAIL] Would send to ${to}: ${subject} :: ${body.length} chars`);
  if (html) {
    // noop reference to avoid unused warning
  }
  
  // Example with Resend (uncomment when configured):
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  return await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    html: html || body,
  });
  */

  throw new Error("Email integration not configured. Please set up Resend, SendGrid, or Nodemailer.");
}


