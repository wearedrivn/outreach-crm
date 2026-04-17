import { prisma } from "./db";
import { decrypt } from "./crypto";
import type { EmailConnection } from "@prisma/client";

export type SendInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendResult = { id: string; via: "gmail" | "outlook" | "smtp" | "resend" };

/**
 * Return the user's active email connection, or null if none is connected
 * (so the caller can fall back to Resend).
 */
export async function getActiveConnection(userId: string): Promise<EmailConnection | null> {
  const conn = await prisma.emailConnection.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  return conn;
}

// ── Gmail ─────────────────────────────────────────────────────────────

async function refreshGmailToken(conn: EmailConnection): Promise<string> {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Gmail OAuth is not configured on the server.");
  }
  if (!conn.refreshToken) {
    throw new Error("No refresh token on Gmail connection — reconnect Gmail.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail token refresh failed: ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await prisma.emailConnection.update({
    where: { id: conn.id },
    data: { accessToken: data.access_token, tokenExpiresAt: expiresAt },
  });
  return data.access_token;
}

async function getValidGmailAccessToken(conn: EmailConnection): Promise<string> {
  const soon = Date.now() + 60 * 1000;
  if (conn.accessToken && conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() > soon) {
    return conn.accessToken;
  }
  return refreshGmailToken(conn);
}

function buildRfc822(from: string, to: string, subject: string, html: string, text?: string): string {
  const boundary = `----=_outreach_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    text || stripHtml(html),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ];
  return lines.join("\r\n");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function base64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendViaGmail(conn: EmailConnection, input: SendInput): Promise<SendResult> {
  const accessToken = await getValidGmailAccessToken(conn);
  const raw = buildRfc822(conn.email, input.to, input.subject, input.html, input.text);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64Url(raw) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed: ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id, via: "gmail" };
}

// ── Outlook (Microsoft Graph) ─────────────────────────────────────────

async function refreshOutlookToken(conn: EmailConnection): Promise<string> {
  const clientId = process.env.OUTLOOK_OAUTH_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Outlook OAuth is not configured on the server.");
  }
  if (!conn.refreshToken) {
    throw new Error("No refresh token on Outlook connection — reconnect Outlook.");
  }

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refreshToken,
      grant_type: "refresh_token",
      scope: "openid email offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Outlook token refresh failed: ${text}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await prisma.emailConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: data.access_token,
      tokenExpiresAt: expiresAt,
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });
  return data.access_token;
}

async function getValidOutlookAccessToken(conn: EmailConnection): Promise<string> {
  const soon = Date.now() + 60 * 1000;
  if (conn.accessToken && conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() > soon) {
    return conn.accessToken;
  }
  return refreshOutlookToken(conn);
}

async function sendViaOutlook(conn: EmailConnection, input: SendInput): Promise<SendResult> {
  const accessToken = await getValidOutlookAccessToken(conn);

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: input.subject,
        body: { contentType: "HTML", content: input.html },
        toRecipients: [{ emailAddress: { address: input.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok && res.status !== 202) {
    const text = await res.text();
    throw new Error(`Outlook send failed: ${text}`);
  }
  // Graph sendMail does not return a message id; synthesize one for logging.
  return { id: `outlook_${Date.now()}`, via: "outlook" };
}

// ── SMTP ───────────────────────────────────────────────────────────────

async function sendViaSmtp(conn: EmailConnection, input: SendInput): Promise<SendResult> {
  if (!conn.smtpHost || !conn.smtpPort || !conn.smtpUser || !conn.smtpPassEnc) {
    throw new Error("SMTP connection is missing host/port/user/password.");
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: conn.smtpHost,
    port: conn.smtpPort,
    secure: conn.smtpSecure ?? conn.smtpPort === 465,
    auth: { user: conn.smtpUser, pass: decrypt(conn.smtpPassEnc) },
  });
  const info = await transporter.sendMail({
    from: `${conn.email}`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { id: info.messageId || `smtp_${Date.now()}`, via: "smtp" };
}

// ── Resend fallback ────────────────────────────────────────────────────

async function sendViaResend(input: SendInput): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("No email connection and RESEND_API_KEY is not set.");
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const result = await resend.emails.send({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { id: result.data?.id || "", via: "resend" };
}

// ── Unified send ───────────────────────────────────────────────────────

export async function sendEmailAsUser(
  userId: string,
  input: SendInput,
): Promise<SendResult> {
  const conn = await getActiveConnection(userId);
  if (!conn) return sendViaResend(input);

  try {
    switch (conn.provider) {
      case "gmail":
        return await sendViaGmail(conn, { ...input, from: conn.email });
      case "outlook":
        return await sendViaOutlook(conn, { ...input, from: conn.email });
      case "smtp":
        return await sendViaSmtp(conn, { ...input, from: conn.email });
      default:
        return sendViaResend(input);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown send error";
    await prisma.emailConnection.update({
      where: { id: conn.id },
      data: { lastError: message.slice(0, 500) },
    });
    throw err;
  }
}

// ── SMTP connection test ──────────────────────────────────────────────

export async function verifySmtp(opts: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    auth: { user: opts.user, pass: opts.pass },
  });
  await transporter.verify();
}
