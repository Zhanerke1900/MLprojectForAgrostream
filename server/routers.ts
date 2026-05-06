import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { contactRequests, forecastCalculations, type User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { isAdminEmail } from "./_core/admin";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "./_core/gmail";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  hashEmailVerificationToken,
  hashPassword,
  hashPasswordResetToken,
  verifyPassword,
} from "./_core/passwordAuth";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  clearPasswordResetToken,
  createPasswordUser,
  ensureConfiguredAdminRole,
  getDb,
  getUserByEmail,
  getUserByEmailVerificationTokenHash,
  getUserByOpenId,
  getUserByPasswordResetTokenHash,
  markEmailVerified,
  markUserSignedIn,
  setEmailVerificationToken,
  setPasswordAuth,
  setPasswordResetToken,
} from "./db";

const optionalContactField = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform(value => (value ? value : undefined));

const contactRequestInput = z.object({
  fullName: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(320),
  phone: optionalContactField(64),
  company: optionalContactField(255),
  country: z.string().trim().min(2).max(128),
  area: z.string().trim().min(1).max(128),
  language: z.enum(["ru", "en"]).default("ru"),
});

const contactRequestStatusInput = z.object({
  id: z.number().int().positive(),
  status: z.enum(["new", "in_progress", "contacted", "closed"]),
});

const normalizeEmailInput = (value: string) => {
  const email = value.trim().toLowerCase();

  if (email === "zhanerke1900gmail.com") {
    return "zhanerke1900@gmail.com";
  }

  return email;
};

const emailInput = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .transform(normalizeEmailInput)
  .refine(value => z.string().email().safeParse(value).success, {
    message: "Invalid email address",
  });

const passwordInput = z.string().min(8).max(128);

const loginInput = z.object({
  email: emailInput,
  password: z.string().min(1).max(128),
  language: z.enum(["ru", "en"]).default("ru"),
});

const registerInput = z.object({
  name: z.string().trim().max(255).optional(),
  email: emailInput,
  password: passwordInput,
  language: z.enum(["ru", "en"]).default("ru"),
});

const forgotPasswordInput = z.object({
  email: emailInput,
  language: z.enum(["ru", "en"]).default("ru"),
});

const resetPasswordInput = z.object({
  token: z.string().trim().min(20).max(256),
  password: passwordInput,
});

const verifyEmailInput = z.object({
  token: z.string().trim().min(20).max(256),
});

const materialInput = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().max(128),
  size: z.number().int().nonnegative(),
});

const forecastFactorInput = z.object({
  name: z.string().trim().min(1).max(128),
  value: z.string().trim().min(1).max(1000),
  impact: z.enum(["pos", "neg", "neu"]),
});

const forecastResultInput = z.object({
  yield_min: z.number(),
  yield_max: z.number(),
  yield_avg: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  analysis: z.string().trim().min(1).max(5000),
  factors: z.array(forecastFactorInput).max(12),
});

const forecastCalculationInput = z.object({
  crop: z.string().trim().min(1).max(255),
  variety: z.string().trim().min(1).max(255),
  predecessor: z.string().trim().min(1).max(255),
  area: z.string().trim().min(1).max(128),
  sowingDate: z.string().trim().min(1).max(128),
  harvestDate: z.string().trim().min(1).max(128),
  set: z.string().trim().min(1).max(64),
  precipitation: z.string().trim().min(1).max(64),
  humus: optionalContactField(64),
  language: z.enum(["ru", "en"]).default("ru"),
  materials: z.array(materialInput).max(12).default([]),
  result: forecastResultInput,
});

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

async function requireDb() {
  const db = await getDb();

  if (!db) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Database is not available.",
    });
  }

  return db;
}

type PublicUser = Pick<
  User,
  | "id"
  | "openId"
  | "name"
  | "email"
  | "loginMethod"
  | "emailVerifiedAt"
  | "role"
  | "createdAt"
  | "updatedAt"
  | "lastSignedIn"
>;

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    emailVerifiedAt: user.emailVerifiedAt,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
  };
}

function adminPassword() {
  return (ENV.adminPassword || "12345678").trim().replace(/^["']|["']$/g, "");
}

function isBootstrapAdminEmail(email: string) {
  return isAdminEmail(email);
}

function getPasswordUserOpenId(email: string) {
  return `email:${email}`;
}

function getRequestOrigin(req: Parameters<typeof getSessionCookieOptions>[0]) {
  if (ENV.publicAppUrl) {
    return ENV.publicAppUrl.replace(/\/+$/, "");
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0]?.trim() || req.protocol || "http";
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0]?.trim() || req.headers.host;

  return `${protocol}://${host}`;
}

async function sendVerificationEmail(
  ctx: { req: Parameters<typeof getSessionCookieOptions>[0] },
  user: User,
  language: "ru" | "en"
) {
  if (!user.email) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User does not have an email address.",
    });
  }

  const { token, tokenHash } = createEmailVerificationToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  await setEmailVerificationToken(user.openId, tokenHash, expiresAt);

  const verifyUrl = `${getRequestOrigin(ctx.req)}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    await sendEmailVerificationEmail({
      to: user.email,
      verifyUrl,
      language,
    });
  } catch (error) {
    console.error("[Auth] Failed to send email verification:", error);
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Could not send verification email. Check Gmail API settings.",
    });
  }
}

async function signInUser(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: any }, user: User) {
  const adminAwareUser = await ensureConfiguredAdminRole(user);
  await markUserSignedIn(adminAwareUser.openId);
  const freshUser = await ensureConfiguredAdminRole(
    (await getUserByOpenId(adminAwareUser.openId)) ?? adminAwareUser
  );
  const sessionToken = await sdk.createSessionToken(freshUser.openId, {
    name: freshUser.name || freshUser.email || "User",
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);

  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  return {
    success: true,
    user: toPublicUser(freshUser),
  } as const;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => (opts.ctx.user ? toPublicUser(opts.ctx.user) : null)),
    register: publicProcedure.input(registerInput).mutation(async ({ ctx, input }) => {
      const existingUser = await getUserByEmail(input.email);
      if (existingUser?.passwordHash && existingUser.emailVerifiedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists.",
        });
      }

      const role = isBootstrapAdminEmail(input.email) ? "admin" : "user";
      const passwordHash = await hashPassword(input.password);
      const name = input.name?.trim() || input.email.split("@")[0] || null;
      let user: User | undefined;

      if (existingUser) {
        await setPasswordAuth(existingUser.openId, { passwordHash, role });
        user = await getUserByOpenId(existingUser.openId);
      } else {
        user = await createPasswordUser({
          openId: getPasswordUserOpenId(input.email),
          email: input.email,
          name,
          passwordHash,
          role,
        });
      }

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create user.",
        });
      }

      await sendVerificationEmail(ctx, user, input.language);

      return {
        success: true,
        requiresEmailVerification: true,
        email: input.email,
      } as const;
    }),
    login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
      const isAdminEmail = isBootstrapAdminEmail(input.email);
      const isAdminBootstrap = isAdminEmail && input.password === adminPassword();
      let user = await getUserByEmail(input.email);

      if (!user && isAdminBootstrap) {
        user = await createPasswordUser({
          openId: getPasswordUserOpenId(input.email),
          email: input.email,
          name: "Zhanerke",
          passwordHash: await hashPassword(input.password),
          role: "admin",
          emailVerifiedAt: new Date(),
        });
      }

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      if (isAdminBootstrap) {
        await setPasswordAuth(user.openId, {
          passwordHash: await hashPassword(adminPassword()),
          role: "admin",
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        });
        user = (await getUserByOpenId(user.openId)) ?? user;
      } else {
        const passwordMatches = await verifyPassword(input.password, user.passwordHash);

        if (!passwordMatches) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        if (!isAdminBootstrap && !user.emailVerifiedAt) {
          await sendVerificationEmail(ctx, user, input.language);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Email is not verified. Check your inbox for a verification link.",
          });
        }
      }

      return signInUser(ctx, user);
    }),
    verifyEmail: publicProcedure
      .input(verifyEmailInput)
      .mutation(async ({ ctx, input }) => {
        const tokenHash = hashEmailVerificationToken(input.token);
        const user = await getUserByEmailVerificationTokenHash(tokenHash);
        const expiresAt = user?.emailVerificationExpiresAt
          ? new Date(user.emailVerificationExpiresAt)
          : null;

        if (!user || !expiresAt || expiresAt.getTime() < Date.now()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email verification link is invalid or expired.",
          });
        }

        await markEmailVerified(user.openId);
        const freshUser = (await getUserByOpenId(user.openId)) ?? user;

        return signInUser(ctx, freshUser);
      }),
    forgotPassword: publicProcedure
      .input(forgotPasswordInput)
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) {
          return { success: true } as const;
        }

        const { token, tokenHash } = createPasswordResetToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
        await setPasswordResetToken(user.openId, tokenHash, expiresAt);

        const resetUrl = `${getRequestOrigin(ctx.req)}/reset-password?token=${encodeURIComponent(token)}`;

        try {
          await sendPasswordResetEmail({
            to: input.email,
            resetUrl,
            language: input.language,
          });
        } catch (error) {
          console.error("[Auth] Failed to send password reset email:", error);
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Could not send reset email. Check Gmail API settings.",
          });
        }

        return { success: true } as const;
      }),
    resetPassword: publicProcedure
      .input(resetPasswordInput)
      .mutation(async ({ ctx, input }) => {
        const tokenHash = hashPasswordResetToken(input.token);
        const user = await getUserByPasswordResetTokenHash(tokenHash);
        const expiresAt = user?.passwordResetExpiresAt
          ? new Date(user.passwordResetExpiresAt)
          : null;

        if (!user || !expiresAt || expiresAt.getTime() < Date.now()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password reset link is invalid or expired.",
          });
        }

        await setPasswordAuth(user.openId, {
          passwordHash: await hashPassword(input.password),
          role: isBootstrapAdminEmail(user.email ?? "") ? "admin" : user.role,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        });
        await clearPasswordResetToken(user.openId);

        const freshUser = (await getUserByOpenId(user.openId)) ?? user;
        return signInUser(ctx, freshUser);
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return {
        success: true,
      } as const;
    }),
  }),
  contact: router({
    createRequest: publicProcedure
      .input(contactRequestInput)
      .mutation(async ({ input }) => {
        const db = await requireDb();

        const result = await db.insert(contactRequests).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone ?? null,
          company: input.company ?? null,
          country: input.country,
          area: input.area,
          language: input.language,
          status: "new",
        });

        return {
          success: true,
          requestId: Number(result[0].insertId),
        } as const;
      }),
  }),
  forecastHistory: router({
    list: adminProcedure.query(async () => {
      const db = await requireDb();

      return db
        .select()
        .from(forecastCalculations)
        .orderBy(desc(forecastCalculations.createdAt))
        .limit(50);
    }),
    create: publicProcedure
      .input(forecastCalculationInput)
      .mutation(async ({ input }) => {
        const db = await requireDb();

        const result = await db.insert(forecastCalculations).values({
          crop: input.crop,
          variety: input.variety,
          predecessor: input.predecessor,
          area: input.area,
          sowingDate: input.sowingDate,
          harvestDate: input.harvestDate,
          set: input.set,
          precipitation: input.precipitation,
          humus: input.humus ?? null,
          language: input.language,
          materialsJson: JSON.stringify(input.materials),
          resultJson: JSON.stringify(input.result),
        });

        return {
          success: true,
          calculationId: Number(result[0].insertId),
        } as const;
      }),
  }),
  admin: router({
    listContactRequests: adminProcedure.query(async () => {
      const db = await requireDb();

      return db
        .select()
        .from(contactRequests)
        .orderBy(desc(contactRequests.createdAt))
        .limit(100);
    }),
    updateContactRequestStatus: adminProcedure
      .input(contactRequestStatusInput)
      .mutation(async ({ input }) => {
        const db = await requireDb();

        await db
          .update(contactRequests)
          .set({ status: input.status })
          .where(eq(contactRequests.id, input.id));

        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
