-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Personal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snippet files table
CREATE TABLE IF NOT EXISTS snippet_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  filename TEXT NOT NULL DEFAULT 'main',
  content TEXT NOT NULL,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add vector column for embeddings
ALTER TABLE snippet_files ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_workspace_name_idx ON tags(workspace_id, name);

-- Snippet tags junction table
CREATE TABLE IF NOT EXISTS snippet_tags (
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  PRIMARY KEY (snippet_id, tag_id)
);

-- Device codes for VS Code extension auth
CREATE TABLE IF NOT EXISTS device_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  authenticated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS snippet_files_embedding_idx ON snippet_files USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS snippets_title_trgm_idx ON snippets USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS snippet_files_content_trgm_idx ON snippet_files USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS snippets_workspace_id_idx ON snippets(workspace_id);
CREATE INDEX IF NOT EXISTS snippets_collection_id_idx ON snippets(collection_id);
CREATE INDEX IF NOT EXISTS snippets_language_idx ON snippets(language);
CREATE INDEX IF NOT EXISTS snippets_is_favorite_idx ON snippets(is_favorite);
CREATE INDEX IF NOT EXISTS snippets_created_at_idx ON snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS collections_workspace_id_idx ON collections(workspace_id);
CREATE INDEX IF NOT EXISTS tags_workspace_id_idx ON tags(workspace_id);
