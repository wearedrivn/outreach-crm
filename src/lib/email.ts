import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Highr <onboarding@resend.dev>";

export async function sendOutreachEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ id: string }> {
  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="color: #18181b; font-size: 14px; line-height: 1.7; white-space: pre-line;">
${body}
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0 16px;" />
        <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
          Sent via Highr — Premium Client Acquisition
        </p>
      </div>
    `,
  });
  return { id: result.data?.id || "" };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 8px;">
          Reset your password
        </h2>
        <p style="color: #52525b; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
          We received a request to reset the password for your Highr account. Click the button below to choose a new one. This link expires in 1 hour.
        </p>
        <div style="margin: 0 0 28px;">
          <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px;">
            Reset password
          </a>
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 8px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all; margin: 0 0 24px;">
          ${resetUrl}
        </p>
        <p style="color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email — your password will not change.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
          Highr — Premium Client Acquisition
        </p>
      </div>
    `,
  });
}

export async function sendOtpEmail(to: string, code: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your Highr verification code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 8px;">
          Verification Code
        </h2>
        <p style="color: #71717a; font-size: 14px; margin: 0 0 24px; line-height: 1.5;">
          Enter this code to complete your sign-in:
        </p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.5;">
          This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 11px; margin: 0;">
          Highr — Premium Client Acquisition
        </p>
      </div>
    `,
  });
}
