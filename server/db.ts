import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { type InsertUser, type User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _dbReady: Promise<void> | null = null;
let memoryUserId = 1;
const memoryUsers = new Map<string, User>();

function cloneUser(user: User) {
  return { ...user };
}

function findMemoryUserByEmail(email: string) {
  return Array.from(memoryUsers.values()).find(user => user.email === email);
}

function createMemoryUser(input: {
  openId: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
  passwordHash?: string | null;
  role?: User["role"];
}) {
  const now = new Date();
  const existing = memoryUsers.get(input.openId);
  const user: User = {
    id: existing?.id ?? memoryUserId++,
    openId: input.openId,
    name: input.name,
    email: input.email,
    loginMethod: input.loginMethod,
    passwordHash: input.passwordHash ?? null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    role: input.role ?? "user",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSignedIn: now,
  };

  memoryUsers.set(input.openId, user);
  return cloneUser(user);
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function ensureDatabaseReady() {
  if (!process.env.DATABASE_URL) {
    console.warn(
      "[Database] DATABASE_URL is not configured; using in-memory auth storage."
    );
    return;
  }

  if (_dbReady) {
    return _dbReady;
  }

  _dbReady = (async () => {
    const db = await getDb();

    if (!db) {
      throw new Error("Database is not available.");
    }

    console.log("[Database] Applying pending migrations...");
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("[Database] Migrations are up to date.");
  })().catch(error => {
    _dbReady = null;
    console.error("[Database] Failed to apply migrations:", error);
    throw error;
  });

  return _dbReady;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    createMemoryUser({
      openId: user.openId,
      email: user.email ?? null,
      name: user.name ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    });
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    const user = memoryUsers.get(openId);
    return user ? cloneUser(user) : undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    const user = findMemoryUserByEmail(email);
    return user ? cloneUser(user) : undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createPasswordUser(input: {
  openId: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: User["role"];
}) {
  const db = await getDb();
  if (!db) {
    return createMemoryUser({
      openId: input.openId,
      email: input.email,
      name: input.name,
      loginMethod: "password",
      passwordHash: input.passwordHash,
      role: input.role,
    });
  }

  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email,
    loginMethod: "password",
    passwordHash: input.passwordHash,
    role: input.role,
    lastSignedIn: new Date(),
  });

  return getUserByOpenId(input.openId);
}

export async function setPasswordAuth(
  openId: string,
  input: {
    passwordHash: string;
    role?: User["role"];
  }
) {
  const db = await getDb();
  if (!db) {
    const user = memoryUsers.get(openId);
    if (!user) return;

    memoryUsers.set(openId, {
      ...user,
      passwordHash: input.passwordHash,
      loginMethod: "password",
      role: input.role ?? user.role,
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(users)
    .set({
      passwordHash: input.passwordHash,
      loginMethod: "password",
      ...(input.role ? { role: input.role } : {}),
    })
    .where(eq(users.openId, openId));
}

export async function markUserSignedIn(openId: string) {
  const db = await getDb();
  if (!db) {
    const user = memoryUsers.get(openId);
    if (!user) return;

    memoryUsers.set(openId, {
      ...user,
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.openId, openId));
}

export async function setPasswordResetToken(
  openId: string,
  tokenHash: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) {
    const user = memoryUsers.get(openId);
    if (!user) return;

    memoryUsers.set(openId, {
      ...user,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(users)
    .set({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    })
    .where(eq(users.openId, openId));
}

export async function clearPasswordResetToken(openId: string) {
  const db = await getDb();
  if (!db) {
    const user = memoryUsers.get(openId);
    if (!user) return;

    memoryUsers.set(openId, {
      ...user,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(users)
    .set({
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(users.openId, openId));
}

export async function getUserByPasswordResetTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) {
    const user = Array.from(memoryUsers.values()).find(
      item => item.passwordResetTokenHash === tokenHash
    );
    return user ? cloneUser(user) : undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetTokenHash, tokenHash))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
