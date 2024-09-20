import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export const userTable = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password"),
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).notNull().default(false),
  // Fields for potential future OAuth integration
  provider: text("provider"),
  providerId: text("provider_id"),
});

export const emailVerificationTable = sqliteTable("email_verification", {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
    code: text("code").notNull(),
    sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
});

export const sessionTable = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expires_at").notNull()
});

export const oauthAccountTable = sqliteTable("oauth_account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  provider: text("provider").notNull(), // google, github
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at").notNull()
})