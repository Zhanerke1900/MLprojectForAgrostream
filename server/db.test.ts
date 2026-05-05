import { describe, expect, it } from "vitest";
import { createPasswordUser, getUserByEmail, upsertUser } from "./db";

describe("in-memory auth storage", () => {
  it("preserves password credentials when updating sign-in metadata", async () => {
    process.env.DATABASE_URL = "";

    const email = `memory-auth-${Date.now()}@example.com`;
    const openId = `email:${email}`;
    const passwordHash = "stored-password-hash";

    await createPasswordUser({
      openId,
      email,
      name: "Memory Auth",
      passwordHash,
      role: "user",
    });

    await upsertUser({
      openId,
      lastSignedIn: new Date(),
    });

    const user = await getUserByEmail(email);

    expect(user).toBeDefined();
    expect(user?.passwordHash).toBe(passwordHash);
    expect(user?.email).toBe(email);
    expect(user?.loginMethod).toBe("password");
  });
});
