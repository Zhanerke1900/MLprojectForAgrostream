import { beforeEach, describe, expect, it, vi } from "vitest";

function decodeBase64Url(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return Buffer.from(padded.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString(
    "utf8"
  );
}

async function loadRouterWithMailMock() {
  vi.resetModules();

  process.env.DATABASE_URL = "";
  process.env.JWT_SECRET = "test-secret";
  process.env.VITE_APP_ID = "test-app";
  process.env.OAUTH_SERVER_URL = "http://localhost/oauth/mock";
  process.env.ADMIN_EMAIL = '"admin@example.com"';
  process.env.ADMIN_PASSWORD = '"12345678"';
  process.env.GMAIL_CLIENT_ID = "gmail-client";
  process.env.GMAIL_CLIENT_SECRET = "gmail-secret";
  process.env.GMAIL_REFRESH_TOKEN = "gmail-refresh";
  process.env.GMAIL_SENDER_EMAIL = "sender@example.com";

  const sentMessages: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "gmail-access-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("gmail.googleapis.com")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { raw?: string };
      if (body.raw) {
        sentMessages.push(decodeBase64Url(body.raw));
      }

      return new Response(JSON.stringify({ id: "message-id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);

  const { appRouter } = await import("./routers");

  return { appRouter, sentMessages };
}

function createAuthCaller(appRouter: Awaited<ReturnType<typeof loadRouterWithMailMock>>["appRouter"]) {
  const cookies: Array<{ name: string; value: string }> = [];
  const caller = appRouter.createCaller({
    req: {
      headers: {
        host: "localhost:3000",
      },
      protocol: "http",
    } as any,
    res: {
      cookie: vi.fn((name: string, value: string) => {
        cookies.push({ name, value });
      }),
      clearCookie: vi.fn(),
    } as any,
    user: null,
  });

  return { caller, cookies };
}

describe("email verification auth flow", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends verification email on registration and signs in after verification", async () => {
    const { appRouter, sentMessages } = await loadRouterWithMailMock();
    const { caller, cookies } = createAuthCaller(appRouter);
    const email = `verify-${Date.now()}@example.com`;

    const registration = await caller.auth.register({
      email,
      password: "12345678",
      name: "Verify User",
      language: "en",
    });

    expect(registration).toEqual({
      success: true,
      requiresEmailVerification: true,
      email,
    });
    expect(cookies).toHaveLength(0);
    expect(sentMessages).toHaveLength(1);

    const tokenMatch = sentMessages[0].match(/verify-email\?token=([^"'<>\s]+)/);
    expect(tokenMatch?.[1]).toBeTruthy();

    const verification = await caller.auth.verifyEmail({ token: tokenMatch![1] });

    expect(verification.success).toBe(true);
    expect(verification.user.email).toBe(email);
    expect(verification.user.emailVerifiedAt).toBeTruthy();
    expect(cookies).toHaveLength(1);
  });

  it("allows configured admin email without email verification and returns admin role", async () => {
    const { appRouter } = await loadRouterWithMailMock();
    const { caller, cookies } = createAuthCaller(appRouter);

    const login = await caller.auth.login({
      email: "admin@example.com",
      password: "12345678",
      language: "en",
    });

    expect(login.success).toBe(true);
    expect(login.user.email).toBe("admin@example.com");
    expect(login.user.role).toBe("admin");
    expect(login.user.emailVerifiedAt).toBeTruthy();
    expect(cookies).toHaveLength(1);
  });
});
