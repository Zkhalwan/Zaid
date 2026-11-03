import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table mapped to Firebase UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// App documents stored in PostgreSQL
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Document edit / version history log
export const documentVersions = pgTable('document_versions', {
  id: serial('id').primaryKey(),
  documentId: text('document_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary').notNull(),
  author: text('author').notNull(),
  changeType: text('change_type').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

// User tool favorites/bookmarks
export const userFavorites = pgTable('user_favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  toolId: text('tool_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// User custom prompt templates
export const userPrompts = pgTable('user_prompts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  category: text('category').notNull(),
  toolTarget: text('tool_target'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  favorites: many(userFavorites),
  prompts: many(userPrompts),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));

export const userPromptsRelations = relations(userPrompts, ({ one }) => ({
  user: one(users, {
    fields: [userPrompts.userId],
    references: [users.id],
  }),
}));
