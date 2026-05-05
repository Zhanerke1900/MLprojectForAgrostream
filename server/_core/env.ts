export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "zhanerke1900@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "12345678",
  publicAppUrl: process.env.APP_PUBLIC_URL ?? "",
  gmailClientId: process.env.GMAIL_CLIENT_ID ?? "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN ?? "",
  gmailSenderEmail: process.env.GMAIL_SENDER_EMAIL ?? "",
  gmailSenderName: process.env.GMAIL_SENDER_NAME ?? "Field Review",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export function validateRuntimeEnv() {
  const missing: string[] = [];

  if (ENV.isProduction && !process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variable(s): ${missing.join(
        ", "
      )}. Set them in Railway variables and redeploy.`
    );
  }
}
