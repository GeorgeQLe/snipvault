import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Extensions to be run as migrations:
// CREATE EXTENSION IF NOT EXISTS vector;
// CREATE EXTENSION IF NOT EXISTS pg_trgm;

// ── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  plan: text('plan').default('free').notNull(), // free | pro
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}));

// ── Workspaces ─────────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull().default('Personal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, { fields: [workspaces.userId], references: [users.id] }),
  collections: many(collections),
  snippets: many(snippets),
  tags: many(tags),
}));

// ── Collections ────────────────────────────────────────────────────────────────

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [collections.workspaceId], references: [workspaces.id] }),
  parent: one(collections, {
    fields: [collections.parentId],
    references: [collections.id],
    relationName: 'parentChild',
  }),
  children: many(collections, { relationName: 'parentChild' }),
  snippets: many(snippets),
}));

// ── Snippets ───────────────────────────────────────────────────────────────────

export const snippets = pgTable('snippets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language'),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  accessCount: integer('access_count').default(0).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  source: text('source').default('manual').notNull(), // manual | gist_import | vscode
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [snippets.workspaceId], references: [workspaces.id] }),
  collection: one(collections, { fields: [snippets.collectionId], references: [collections.id] }),
  files: many(snippetFiles),
  snippetTags: many(snippetTags),
}));

// ── Snippet Files ──────────────────────────────────────────────────────────────

export const snippetFiles = pgTable('snippet_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  snippetId: uuid('snippet_id')
    .references(() => snippets.id, { onDelete: 'cascade' })
    .notNull(),
  filename: text('filename').notNull().default('main'),
  content: text('content').notNull(),
  language: text('language'),
  // embedding vector(1536) — added via migration SQL
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const snippetFilesRelations = relations(snippetFiles, ({ one }) => ({
  snippet: one(snippets, { fields: [snippetFiles.snippetId], references: [snippets.id] }),
}));

// ── Tags ───────────────────────────────────────────────────────────────────────

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    color: text('color').default('gray').notNull(), // blue=language, green=framework, purple=purpose, gray=other
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tags_workspace_name_idx').on(table.workspaceId, table.name),
  ],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [tags.workspaceId], references: [workspaces.id] }),
  snippetTags: many(snippetTags),
}));

// ── Snippet Tags (junction) ───────────────────────────────────────────────────

export const snippetTags = pgTable(
  'snippet_tags',
  {
    snippetId: uuid('snippet_id')
      .references(() => snippets.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    source: text('source').default('manual').notNull(), // ai | manual
  },
  (table) => [
    primaryKey({ columns: [table.snippetId, table.tagId] }),
  ],
);

export const snippetTagsRelations = relations(snippetTags, ({ one }) => ({
  snippet: one(snippets, { fields: [snippetTags.snippetId], references: [snippets.id] }),
  tag: one(tags, { fields: [snippetTags.tagId], references: [tags.id] }),
}));

// ── Device Codes (for VS Code extension auth) ─────────────────────────────────

export const deviceCodes = pgTable('device_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  authenticatedAt: timestamp('authenticated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Type Exports ───────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Snippet = typeof snippets.$inferSelect;
export type SnippetFile = typeof snippetFiles.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type SnippetTag = typeof snippetTags.$inferSelect;
export type DeviceCode = typeof deviceCodes.$inferSelect;
