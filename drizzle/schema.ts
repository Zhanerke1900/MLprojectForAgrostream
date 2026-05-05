import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordResetTokenHash: varchar("passwordResetTokenHash", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const contactRequests = mysqlTable("contact_requests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  country: varchar("country", { length: 128 }).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  language: mysqlEnum("language", ["ru", "en"]).default("ru").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "contacted", "closed"])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = typeof contactRequests.$inferInsert;

export const forecastCalculations = mysqlTable("forecast_calculations", {
  id: int("id").autoincrement().primaryKey(),
  crop: varchar("crop", { length: 255 }).notNull(),
  variety: varchar("variety", { length: 255 }).notNull(),
  predecessor: varchar("predecessor", { length: 255 }).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  sowingDate: varchar("sowingDate", { length: 128 }).notNull(),
  harvestDate: varchar("harvestDate", { length: 128 }).notNull(),
  set: varchar("set", { length: 64 }).notNull(),
  precipitation: varchar("precipitation", { length: 64 }).notNull(),
  humus: varchar("humus", { length: 64 }),
  language: mysqlEnum("language", ["ru", "en"]).default("ru").notNull(),
  materialsJson: text("materialsJson").notNull(),
  resultJson: text("resultJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForecastCalculation = typeof forecastCalculations.$inferSelect;
export type InsertForecastCalculation = typeof forecastCalculations.$inferInsert;
