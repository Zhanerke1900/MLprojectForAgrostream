import { ENV } from "./env";

/**
 * Admin configuration and utilities.
 *
 * Keep the owner email in code as a fallback, but also honor ADMIN_EMAIL from
 * the runtime environment so deployed config can bootstrap access.
 */

const FALLBACK_ADMIN_EMAILS = ["zhanerke1900@gmail.com"];
const ADMIN_EMAILS = new Set<string>();

function normalizeEmail(email: string | null | undefined): string {
  const normalized = String(email || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  if (normalized === "zhanerke1900gmail.com") {
    return "zhanerke1900@gmail.com";
  }

  return normalized;
}

function getConfiguredAdminEmails() {
  const configured = String(ENV.adminEmail || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  return new Set([
    ...FALLBACK_ADMIN_EMAILS.map(normalizeEmail),
    ...configured,
    ...Array.from(ADMIN_EMAILS),
  ]);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return getConfiguredAdminEmails().has(normalizeEmail(email));
}

export function addAdminEmail(email: string): void {
  const normalized = normalizeEmail(email);
  if (normalized) {
    ADMIN_EMAILS.add(normalized);
  }
}

export function removeAdminEmail(email: string): void {
  ADMIN_EMAILS.delete(normalizeEmail(email));
}

export function getAdminEmails(): string[] {
  return Array.from(getConfiguredAdminEmails());
}
