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

type EmailVerificationInput = {
  to: string;
  verifyUrl: string;
  language: "ru" | "en";
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isEnabled(value: string | undefined, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function getRequestedProvider() {
  const provider = String(process.env.MAIL_PROVIDER || process.env.EMAIL_PROVIDER || "")
    .trim()
    .toLowerCase();

  return provider === "gmail" || provider === "log" || provider === "auto"
    ? provider
    : "";
}

function getGmailConfig() {
  return {
    clientId: ENV.gmailClientId,
    clientSecret: ENV.gmailClientSecret,
    refreshToken: ENV.gmailRefreshToken,
    senderEmail: ENV.gmailSenderEmail || process.env.GMAIL_SENDER || "",
    senderName: ENV.gmailSenderName || "Field Review",
  };
}

function isGmailConfigured() {
  const config = getGmailConfig();

  return Boolean(
    config.clientId &&
      config.clientSecret &&
      config.refreshToken &&
      config.senderEmail
  );
}

function shouldLogFallback() {
  return isEnabled(process.env.MAIL_LOG_FALLBACK, true);
}

function shouldLogCopy() {
  return isEnabled(process.env.MAIL_LOG_COPY, false);
}

function clipForLogs(value: string, maxLength = 12_000) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n...[truncated ${text.length - maxLength} chars]`;
}

function extractLinks(input: SendGmailEmailInput) {
  const source = `${input.text}\n${input.html}`;
  const matches = source.match(/https?:\/\/[^\s"'<>]+/g) || [];

  return Array.from(
    new Set(
      matches
        .map(url => url.replaceAll("&amp;", "&").replace(/[),.;]+$/g, ""))
        .filter(Boolean)
    )
  );
}

async function logEmailDelivery(input: SendGmailEmailInput, reason: string) {
  console.log("MAIL LOG DELIVERY");
  console.log("   provider:", "log");
  console.log("   reason:", reason);
  console.log("   from:", getMailFrom());
  console.log("   to:", input.to);
  console.log("   subject:", input.subject);
  extractLinks(input).forEach((link, index) => {
    console.log(`   LINK_${index + 1}:`, link);
  });
  console.log("   text:");
  console.log(clipForLogs(input.text));
  console.log("   html:");
  console.log(clipForLogs(input.html));
  console.log("MAIL LOG DELIVERY END");
}

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

function getMailFrom() {
  const gmailFrom = process.env.GMAIL_FROM;
  if (gmailFrom) return sanitizeHeader(gmailFrom);

  const config = getGmailConfig();
  const senderEmail = sanitizeHeader(config.senderEmail);
  const senderName = sanitizeHeader(config.senderName || "Field Review");

  if (!senderEmail) {
    return "Field Review <no-reply@crop.local>";
  }

  return senderName ? `"${senderName}" <${senderEmail}>` : senderEmail;
}

function buildMimeMessage(input: SendGmailEmailInput) {
  const boundary = `field-review-${randomBytes(8).toString("hex")}`;
  const from = getMailFrom();

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
  const config = getGmailConfig();
  const missing = [
    ["GMAIL_CLIENT_ID", config.clientId],
    ["GMAIL_CLIENT_SECRET", config.clientSecret],
    ["GMAIL_REFRESH_TOKEN", config.refreshToken],
    ["GMAIL_SENDER_EMAIL", config.senderEmail],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Gmail API is not configured. Missing: ${missing.join(", ")}`);
  }
}

async function getGmailAccessToken() {
  assertGmailConfig();
  const config = getGmailConfig();

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
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
  const provider = getRequestedProvider();

  if (provider === "log") {
    await logEmailDelivery(input, "MAIL_PROVIDER=log");
    return;
  }

  if (!isGmailConfigured()) {
    if (shouldLogFallback()) {
      await logEmailDelivery(input, "Gmail API is not configured");
      return;
    }

    assertGmailConfig();
  }

  try {
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

    if (shouldLogCopy()) {
      await logEmailDelivery(input, "Gmail API sent email; MAIL_LOG_COPY=true");
    }
  } catch (error) {
    if (!shouldLogFallback()) {
      throw error;
    }

    console.error("[MAILER] Gmail API send failed; falling back to log:", error);
    await logEmailDelivery(
      input,
      `Gmail API send failed: ${error instanceof Error ? error.message : String(error)}`
    );
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

export async function sendEmailVerificationEmail({
  to,
  verifyUrl,
  language,
}: EmailVerificationInput) {
  const subject =
    language === "ru"
      ? "Подтвердите email для Crop Forecast"
      : "Confirm your Crop Forecast email";
  const text =
    language === "ru"
      ? `Подтвердите email, открыв ссылку: ${verifyUrl}\n\nЕсли вы не создавали аккаунт, просто проигнорируйте это письмо.`
      : `Confirm your email by opening this link: ${verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html =
    language === "ru"
      ? `<p>Подтвердите email, открыв ссылку:</p><p><a href="${escapeHtml(verifyUrl)}">${escapeHtml(verifyUrl)}</a></p><p>Если вы не создавали аккаунт, просто проигнорируйте это письмо.</p>`
      : `<p>Confirm your email by opening this link:</p><p><a href="${escapeHtml(verifyUrl)}">${escapeHtml(verifyUrl)}</a></p><p>If you did not create an account, you can ignore this email.</p>`;

  await sendGmailEmail({
    to,
    subject,
    text,
    html,
  });
}
