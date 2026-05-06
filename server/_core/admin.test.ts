import { describe, expect, it, vi } from "vitest";

describe("admin email configuration", () => {
  it("matches the built-in owner email", async () => {
    vi.resetModules();
    process.env.ADMIN_EMAIL = "";

    const { isAdminEmail } = await import("./admin");

    expect(isAdminEmail("zhanerke1900@gmail.com")).toBe(true);
    expect(isAdminEmail("ZHANERKE1900@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("zhanerke1900@gmail.com  ")).toBe(true);
    expect(isAdminEmail("other@gmail.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("honors ADMIN_EMAIL from the environment", async () => {
    vi.resetModules();
    process.env.ADMIN_EMAIL = '"admin@example.com"';

    const { isAdminEmail, getAdminEmails } = await import("./admin");

    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(getAdminEmails()).toContain("admin@example.com");
  });

  it("normalizes the common missing-at typo for the owner email", async () => {
    vi.resetModules();
    process.env.ADMIN_EMAIL = "zhanerke1900gmail.com";

    const { isAdminEmail } = await import("./admin");

    expect(isAdminEmail("zhanerke1900@gmail.com")).toBe(true);
    expect(isAdminEmail("zhanerke1900gmail.com")).toBe(true);
  });
});
