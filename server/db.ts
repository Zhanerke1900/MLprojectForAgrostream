import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { type InsertUser, type User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _dbReady: Promise<void> | null = null;
let memoryUserId = 1;
const memoryUsers = new Map<string, User>();

type SqlError = {
  code?: string;
  errno?: number;
  message?: string;
  cause?: unknown;
};

function cloneUser(user: User) {
  return { ...user };
}

function findMemoryUserByEmail(email: string) {
  return Array.from(memoryUsers.values()).find(user => user.email === email);
}

function createMemoryUser(input: {
  openId: string;
  email?: string | null;
  name?: string | null;
  loginMethod?: string | null;
  passwordHash?: string | null;
  role?: User["role"];
  lastSignedIn?: Date;
}) {
  const now = new Date();
  const existing = memoryUsers.get(input.openId);
  const user: User = {
    id: existing?.id ?? memoryUserId++,
    openId: input.openId,
    name: input.name !== undefined ? input.name : existing?.name ?? null,
    email: input.email !== undefined ? input.email : existing?.email ?? null,
    loginMethod:
      input.loginMethod !== undefined
        ? input.loginMethod
        : existing?.loginMethod ?? null,
    passwordHash:
      input.passwordHash !== undefined
        ? input.passwordHash
        : existing?.passwordHash ?? null,
    passwordResetTokenHash: existing?.passwordResetTokenHash ?? null,
    passwordResetExpiresAt: existing?.passwordResetExpiresAt ?? null,
    role: input.role ?? existing?.role ?? "user",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastSignedIn: input.lastSignedIn ?? existing?.lastSignedIn ?? now,
  };

  memoryUsers.set(input.openId, user);
  return cloneUser(user);
}

function errorMatches(error: unknown, codes: string[], errnos: number[]) {
  let current: unknown = error;

  while (current && typeof current === "object") {
    const sqlError = current as SqlError;

    if (sqlError.code && codes.includes(sqlError.code)) return true;
    if (sqlError.errno && errnos.includes(sqlError.errno)) return true;
    if (sqlError.message) {
      const message = sqlError.message.toLowerCase();
      if (codes.some(code => message.includes(code.toLowerCase()))) {
        return true;
      }
    }

    current = sqlError.cause;
  }

  return false;
}

function isDuplicateTableError(error: unknown) {
  return errorMatches(error, ["ER_TABLE_EXISTS_ERROR"], [1050]);
}

async function columnExists(
  db: NonNullable<typeof _db>,
  tableName: string,
  columnName: string
) {
  const [rows] = (await db.execute(
    sql.raw(`SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`)
  )) as unknown as [unknown[], unknown];

  return Array.isArray(rows) && rows.length > 0;
}

async function ensureColumn(
  db: NonNullable<typeof _db>,
  tableName: string,
  columnName: string,
  definition: string
) {
  if (await columnExists(db, tableName, columnName)) {
    return;
  }

  try {
    const statement = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`;
    await db.execute(sql.raw(statement));
    console.log(`[Database] Added ${tableName}.${columnName} column.`);
  } catch (error) {
    if (errorMatches(error, ["ER_DUP_FIELDNAME"], [1060])) {
      return;
    }

    throw error;
  }
}

async function ensurePasswordAuthColumns(db: NonNullable<typeof _db>) {
  await ensureColumn(db, "users", "passwordHash", "varchar(255)");
  await ensureColumn(db, "users", "passwordResetTokenHash", "varchar(128)");
  await ensureColumn(db, "users", "passwordResetExpiresAt", "timestamp");
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
    try {
      await migrate(db, { migrationsFolder: "drizzle" });
    } catch (error) {
      if (!isDuplicateTableError(error)) {
        throw error;
      }

      console.warn(
        "[Database] Existing tables found without a complete migration journal; continuing with schema repair."
      );
    }
    await ensurePasswordAuthColumns(db);
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
    const memoryInput: Parameters<typeof createMemoryUser>[0] = {
      openId: user.openId,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    if (user.email !== undefined) {
      memoryInput.email = user.email ?? null;
    }
    if (user.name !== undefined) {
      memoryInput.name = user.name ?? null;
    }
    if (user.loginMethod !== undefined) {
      memoryInput.loginMethod = user.loginMethod ?? null;
    }
    if (user.role !== undefined) {
      memoryInput.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      memoryInput.role = "admin";
    }

    createMemoryUser(memoryInput);
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
