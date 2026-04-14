# SnipVault - Project Vision & Next Steps

## Vision

SnipVault is a cloud-native code snippet manager that combines intelligent organization with developer workflow integration. Users save, tag, search, and reuse code snippets through a Next.js web app or directly from VS Code. AI powers automatic tagging and semantic search, while Stripe handles a free/pro tier model.

## Architecture Summary

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Monaco Editor
- **Backend:** tRPC routers (snippet, collection, tag, search, billing)
- **Database:** Neon PostgreSQL via Drizzle ORM; pgvector for embeddings, pg_trgm for fuzzy text
- **Auth:** Clerk (web) + device code flow (VS Code extension)
- **AI:** OpenAI GPT-4o-mini (auto-tagging), text-embedding-3-small (semantic search)
- **Payments:** Stripe subscriptions with webhook handling
- **Email:** Resend for transactional emails
- **IDE:** VS Code extension with save-snippet and search commands

## What's Built (current dirty state)

- [x] Database schema: users, workspaces, collections, snippets, snippet_files, tags, snippet_tags, device_codes
- [x] Drizzle ORM setup with Neon serverless driver
- [x] Clerk auth middleware with public route exceptions
- [x] Environment validation with Zod
- [x] tRPC routers: snippet CRUD, collection management, tag operations, billing, hybrid search
- [x] AI auto-tagging pipeline (GPT-4o-mini with retry logic)
- [x] Embedding generation and storage (text-embedding-3-small, pgvector)
- [x] Hybrid search: vector similarity (70%) + trigram text (30%) with recency/favorite boosts
- [x] Similar snippets endpoint (5 nearest neighbors)
- [x] Stripe billing: plan limits, checkout session, webhook handler (checkout, subscription update/delete)
- [x] GitHub Gist import (paginated fetch with raw content retrieval)
- [x] VS Code extension: device code auth, save snippet, search snippets, status bar integration
- [x] Dashboard UI: stats cards, recent snippets grid, sidebar navigation
- [x] Pages: dashboard, library, collections, search, billing, settings, import, snippet detail/edit/new
- [x] UI components: button, card, badge, input, textarea, select, dialog, command palette
- [x] Code editor (Monaco) and code preview (Shiki) components
- [x] Collection tree, tag input, search bar/results, snippet card/grid components
- [x] Auth pages (sign-in, sign-up) via Clerk
- [x] Device auth confirmation page (web side)
- [x] Dark theme with custom scrollbar styling

## Next Steps

### High Priority
- [ ] Run Drizzle migrations and verify schema against Neon (embedding vector column needs manual SQL migration)
- [ ] Add Clerk webhook handler to sync user creation/deletion with the users table
- [ ] Wire up the Gist import UI to the existing API routes
- [ ] Add error boundaries and loading states across all dashboard pages
- [ ] Implement plan-gating: enforce `PLAN_LIMITS` in tRPC procedures (snippet count cap, feature flags for AI/search/extension/import)

### Medium Priority
- [ ] Add multi-file snippet support in the create/edit UI (schema supports it, UI currently assumes single file)
- [ ] Build the settings page: profile info, connected accounts, danger zone (delete account)
- [ ] Build the billing page: current plan display, upgrade/downgrade flow, usage meters
- [ ] Add snippet sharing: public links with optional expiration
- [ ] Implement collection drag-and-drop reordering (sortOrder field exists)
- [ ] Add keyboard shortcuts for common actions (Cmd+K search, Cmd+S save)

### VS Code Extension
- [ ] Add `package.json` for the extension with activation events and contribution points
- [ ] Set up esbuild/webpack bundling for the extension
- [ ] Add snippet insertion command (paste snippet into active editor)
- [ ] Add tree view provider for browsing collections/snippets in the sidebar
- [ ] Publish to VS Code Marketplace

### Polish & Infrastructure
- [ ] Add rate limiting on API routes (especially AI endpoints)
- [ ] Set up CI/CD pipeline (lint, type-check, build)
- [ ] Add integration tests for tRPC routers
- [ ] Implement proper `updatedAt` triggers or middleware
- [ ] Add OpenGraph metadata and a landing page
- [ ] SQL injection audit on raw SQL in search router (parameterize `sql.unsafe` calls)
- [ ] Add CSP headers and security hardening for production
