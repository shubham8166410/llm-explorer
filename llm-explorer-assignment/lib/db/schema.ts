import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const promptSessions = sqliteTable("prompt_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => promptSessions.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  // Model configuration — stored per-generation so history reflects exact settings used
  model: text("model").notNull().default("claude-haiku-4-5"),
  temperature: real("temperature").notNull().default(0.7),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  lifecycle: text("lifecycle", { enum: ["active", "superseded"] })
    .notNull()
    .default("active"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const generatedItems = sqliteTable("generated_items", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => promptSessions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags").notNull().default("[]"),
  status: text("status", { enum: ["active", "deleted"] })
    .notNull()
    .default("active"),
  editedAt: integer("edited_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type PromptSession = typeof promptSessions.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type GeneratedItem = typeof generatedItems.$inferSelect;
