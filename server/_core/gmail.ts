import { randomBytes } from "crypto";
import { ENV } from "./env";

type SendGmailEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  language: "ru" | "en";
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function buildMimeMessage(input: SendGmailEmailInput) {
  const boundary = `field-review-${randomBytes(8).toString("hex")}`;
  const senderName = sanitizeHeader(ENV.gmailSenderName || "Field Review");
  const senderEmail = sanitizeHeader(ENV.gmailSenderEmail);
  const from = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;

  return [
    `From: ${from}`,
    `To: ${sanitizeHeader(input.to)}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

function assertGmailConfig() {
  const missing = [
    ["GMAIL_CLIENT_ID", ENV.gmailClientId],
    ["GMAIL_CLIENT_SECRET", ENV.gmailClientSecret],
    ["GMAIL_REFRESH_TOKEN", ENV.gmailRefreshToken],
    ["GMAIL_SENDER_EMAIL", ENV.gmailSenderEmail],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Gmail API is not configured. Missing: ${missing.join(", ")}`);
  }
}

async function getGmailAccessToken() {
  assertGmailConfig();

  const body = new URLSearchParams({
    client_id: ENV.gmailClientId,
    client_secret: ENV.gmailClientSecret,
    refresh_token: ENV.gmailRefreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        `Could not get Gmail access token (${response.status})`
    );
  }

  return payload.access_token;
}

export async function sendGmailEmail(input: SendGmailEmailInput) {
  const accessToken = await getGmailAccessToken();
  const raw = toBase64Url(buildMimeMessage(input));

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Gmail API send failed (${response.status}): ${message}`);
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  language,
}: PasswordResetEmailInput) {
  const subject =
    language === "ru" ? "Сброс пароля Field Review" : "Reset your Field Review password";
  const text =
    language === "ru"
      ? `Чтобы сменить пароль, откройте ссылку: ${resetUrl}\n\nЕсли вы не запрашивали сброс, просто проигнорируйте это письмо.`
      : `Open this link to reset your password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html =
    language === "ru"
      ? `<p>Чтобы сменить пароль, откройте ссылку:</p><p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p><p>Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>`
      : `<p>Open this link to reset your password:</p><p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p><p>If you did not request this, you can ignore this email.</p>`;

  await sendGmailEmail({
    to,
    subject,
    text,
    html,
  });
}
