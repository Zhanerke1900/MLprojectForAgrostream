/**
 * Admin configuration and utilities
 * Hardcoded admin emails for authorization
 */

const ADMIN_EMAILS = new Set(["zhanerke1900@gmail.com"]);

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function addAdminEmail(email: string): void {
  ADMIN_EMAILS.add(email.trim().toLowerCase());
}

export function removeAdminEmail(email: string): void {
  ADMIN_EMAILS.delete(email.trim().toLowerCase());
}

export function getAdminEmails(): string[] {
  return Array.from(ADMIN_EMAILS);
}
