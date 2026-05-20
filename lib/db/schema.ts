import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const thanas = pgTable("thanas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const thanasRelations = relations(thanas, ({ many }) => ({
  profiles: many(profiles),
}));

export const ranks = pgTable("ranks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const ranksRelations = relations(ranks, ({ many }) => ({
  profiles: many(profiles),
}));

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users(id)
  username: text("username").notNull().unique(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  avatar_url: text("avatar_url"),
  rank_id: uuid("rank_id").references(() => ranks.id, { onDelete: "set null" }),
  thana_id: uuid("thana_id").references(() => thanas.id, {
    onDelete: "set null",
  }),
  role: text("role").notNull().default("member"),
  is_verified: boolean("is_verified").notNull().default(false),
  profile_completed: boolean("profile_completed").notNull().default(false),
  hide_sensitive_info: boolean("hide_sensitive_info").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  thana: one(thanas, {
    fields: [profiles.thana_id],
    references: [thanas.id],
  }),
  rank: one(ranks, {
    fields: [profiles.rank_id],
    references: [ranks.id],
  }),
  transactions: many(transactions),
  pdf_submissions: many(pdfSubmissions),
  action_logs_as_actor: many(actionLogs, { relationName: "actor" }),
  action_logs_as_target: many(actionLogs, { relationName: "target" }),
}));

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  short_id: text("short_id")
    .notNull()
    .unique()
    .default(sql`substr(md5(random()::text), 1, 6)`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  is_syllabus: boolean("is_syllabus").notNull().default(false),
  pages: integer("pages"),
  pdf_link: text("pdf_link"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const booksRelations = relations(books, ({ many }) => ({
  copies: many(copies),
  transactions: many(transactions),
  pdf_submissions: many(pdfSubmissions),
}));

export const copies = pgTable("copies", {
  id: text("id").primaryKey(), // e.g. "QR001"
  book_id: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  copy_number: integer("copy_number").notNull().default(1),
  status: text("status").notNull().default("available"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const copiesRelations = relations(copies, ({ one, many }) => ({
  book: one(books, {
    fields: [copies.book_id],
    references: [books.id],
  }),
  transactions: many(transactions),
}));

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  copy_id: text("copy_id")
    .notNull()
    .references(() => copies.id, { onDelete: "cascade" }),
  book_id: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  request_date: timestamp("request_date", { withTimezone: true }).defaultNow(),
  approved_date: timestamp("approved_date", { withTimezone: true }),
  due_date: date("due_date"),
  return_date: timestamp("return_date", { withTimezone: true }),
  rejection_reason: text("rejection_reason"),
  reviewed_by: uuid("reviewed_by").references(() => profiles.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(profiles, {
    fields: [transactions.user_id],
    references: [profiles.id],
  }),
  copy: one(copies, {
    fields: [transactions.copy_id],
    references: [copies.id],
  }),
  book: one(books, {
    fields: [transactions.book_id],
    references: [books.id],
  }),
  reviewer: one(profiles, {
    fields: [transactions.reviewed_by],
    references: [profiles.id],
  }),
}));

export const pdfSubmissions = pgTable("pdf_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  book_id: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  read_date: date("read_date"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  submitted_at: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  reviewed_by: uuid("reviewed_by").references(() => profiles.id),
  rejection_reason: text("rejection_reason"),
});

export const pdfSubmissionsRelations = relations(pdfSubmissions, ({ one }) => ({
  user: one(profiles, {
    fields: [pdfSubmissions.user_id],
    references: [profiles.id],
  }),
  book: one(books, {
    fields: [pdfSubmissions.book_id],
    references: [books.id],
  }),
  reviewer: one(profiles, {
    fields: [pdfSubmissions.reviewed_by],
    references: [profiles.id],
  }),
}));

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const actionLogs = pgTable("action_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action_type: text("action_type").notNull(),
  actor_id: uuid("actor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  target_id: uuid("target_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  details: text("details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [actionLogs.actor_id],
    references: [profiles.id],
    relationName: "actor",
  }),
  target: one(profiles, {
    fields: [actionLogs.target_id],
    references: [profiles.id],
    relationName: "target",
  }),
}));
