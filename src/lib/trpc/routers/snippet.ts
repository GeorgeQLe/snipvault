import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { snippets, snippetFiles, snippetTags } from '@/lib/db/schema';
import { eq, and, desc, asc, inArray, ilike, sql } from 'drizzle-orm';
import { detectLanguage } from '@/lib/language-detection';
import { autoTagSnippet } from '@/lib/ai/tagging';
import { generateEmbedding } from '@/lib/ai/embeddings';

export const snippetRouter = router({
  /**
   * List snippets with cursor-based pagination and filters.
   */
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
        collectionId: z.string().uuid().optional(),
        language: z.string().optional(),
        isFavorite: z.boolean().optional(),
        tagIds: z.array(z.string().uuid()).optional(),
        search: z.string().optional(),
        sortBy: z.enum(['created', 'updated', 'title', 'accessed']).default('created'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, collectionId, language, isFavorite, tagIds, search, sortBy, sortOrder } = input;

      const conditions = [eq(snippets.workspaceId, ctx.workspaceId)];

      if (collectionId) {
        conditions.push(eq(snippets.collectionId, collectionId));
      }

      if (language) {
        conditions.push(eq(snippets.language, language));
      }

      if (isFavorite !== undefined) {
        conditions.push(eq(snippets.isFavorite, isFavorite));
      }

      if (search) {
        conditions.push(
          sql`(${snippets.title} ILIKE ${'%' + search + '%'} OR ${snippets.description} ILIKE ${'%' + search + '%'})`,
        );
      }

      // If filtering by tags, get snippet IDs that have ALL specified tags
      let snippetIdsFromTags: string[] | undefined;
      if (tagIds && tagIds.length > 0) {
        const tagResults = await ctx.db
          .select({ snippetId: snippetTags.snippetId })
          .from(snippetTags)
          .where(inArray(snippetTags.tagId, tagIds))
          .groupBy(snippetTags.snippetId)
          .having(sql`COUNT(DISTINCT ${snippetTags.tagId}) = ${tagIds.length}`);

        snippetIdsFromTags = tagResults.map((r) => r.snippetId);
        if (snippetIdsFromTags.length === 0) {
          return { items: [], nextCursor: undefined };
        }
        conditions.push(inArray(snippets.id, snippetIdsFromTags));
      }

      // Cursor-based pagination
      if (cursor) {
        const cursorSnippet = await ctx.db.query.snippets.findFirst({
          where: eq(snippets.id, cursor),
        });
        if (cursorSnippet) {
          if (sortOrder === 'desc') {
            conditions.push(sql`${snippets.createdAt} < ${cursorSnippet.createdAt}`);
          } else {
            conditions.push(sql`${snippets.createdAt} > ${cursorSnippet.createdAt}`);
          }
        }
      }

      const sortColumn = {
        created: snippets.createdAt,
        updated: snippets.updatedAt,
        title: snippets.title,
        accessed: snippets.lastAccessedAt,
      }[sortBy] ?? snippets.createdAt;

      const orderFn = sortOrder === 'desc' ? desc : asc;

      const items = await ctx.db.query.snippets.findMany({
        where: and(...conditions),
        orderBy: [orderFn(sortColumn)],
        limit: limit + 1,
        with: {
          files: { limit: 1 },
          snippetTags: {
            with: { tag: true },
          },
          collection: true,
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  /**
   * Get a single snippet by ID with full details.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const snippet = await ctx.db.query.snippets.findFirst({
        where: and(eq(snippets.id, input.id), eq(snippets.workspaceId, ctx.workspaceId)),
        with: {
          files: true,
          snippetTags: {
            with: { tag: true },
          },
          collection: true,
        },
      });

      if (!snippet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snippet not found" });
      }

      // Increment access count
      await ctx.db
        .update(snippets)
        .set({
          accessCount: sql`${snippets.accessCount} + 1`,
          lastAccessedAt: new Date(),
        })
        .where(eq(snippets.id, input.id));

      return snippet;
    }),

  /**
   * Create a new snippet with its file.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        language: z.string().optional(),
        collectionId: z.string().uuid().optional(),
        content: z.string().min(1),
        filename: z.string().default('main'),
        tagIds: z.array(z.string().uuid()).optional(),
        source: z.enum(['manual', 'gist_import', 'vscode']).default('manual'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const detectedLanguage =
        input.language || detectLanguage(input.content, input.filename) || null;

      // Create snippet
      const [snippet] = await ctx.db
        .insert(snippets)
        .values({
          workspaceId: ctx.workspaceId,
          title: input.title,
          description: input.description,
          language: detectedLanguage,
          collectionId: input.collectionId,
          source: input.source,
        })
        .returning();

      // Create snippet file
      const [file] = await ctx.db
        .insert(snippetFiles)
        .values({
          snippetId: snippet.id,
          filename: input.filename,
          content: input.content,
          language: detectedLanguage,
        })
        .returning();

      // Add manual tags
      if (input.tagIds && input.tagIds.length > 0) {
        await ctx.db.insert(snippetTags).values(
          input.tagIds.map((tagId) => ({
            snippetId: snippet.id,
            tagId,
            source: 'manual' as const,
          })),
        );
      }

      // Trigger AI tagging + embedding in background (fire and forget)
      Promise.all([
        autoTagSnippet(
          snippet.id,
          ctx.workspaceId,
          input.title,
          input.content,
          detectedLanguage,
          input.description,
        ),
        generateEmbedding(
          file.id,
          input.title,
          input.description ?? null,
          detectedLanguage,
          input.content,
        ),
      ]).catch((err) => {
        console.error(`[Snippet ${snippet.id}] Background AI tasks failed:`, err);
      });

      return snippet;
    }),

  /**
   * Update a snippet and its file.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        language: z.string().optional(),
        collectionId: z.string().uuid().nullable().optional(),
        content: z.string().optional(),
        filename: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.snippets.findFirst({
        where: and(eq(snippets.id, input.id), eq(snippets.workspaceId, ctx.workspaceId)),
        with: { files: { limit: 1 } },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snippet not found" });
      }

      const snippetUpdates: Record<string, unknown> = { updatedAt: new Date() };

      if (input.title !== undefined) snippetUpdates.title = input.title;
      if (input.description !== undefined) snippetUpdates.description = input.description;
      if (input.language !== undefined) snippetUpdates.language = input.language;
      if (input.collectionId !== undefined) snippetUpdates.collectionId = input.collectionId;

      await ctx.db.update(snippets).set(snippetUpdates).where(eq(snippets.id, input.id));

      let contentChanged = false;
      const file = existing.files[0];

      if (file && (input.content !== undefined || input.filename !== undefined)) {
        const fileUpdates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.content !== undefined) {
          fileUpdates.content = input.content;
          contentChanged = input.content !== file.content;
        }
        if (input.filename !== undefined) fileUpdates.filename = input.filename;
        if (input.language !== undefined) fileUpdates.language = input.language;

        await ctx.db.update(snippetFiles).set(fileUpdates).where(eq(snippetFiles.id, file.id));
      }

      // Re-trigger AI if content changed
      if (contentChanged && file) {
        const title = input.title ?? existing.title;
        const content = input.content ?? file.content;
        const language = input.language ?? existing.language;
        const description = input.description ?? existing.description;

        Promise.all([
          autoTagSnippet(existing.id, ctx.workspaceId, title, content, language, description),
          generateEmbedding(file.id, title, description ?? null, language, content),
        ]).catch((err) => {
          console.error(`[Snippet ${existing.id}] Background AI tasks failed:`, err);
        });
      }

      return { id: input.id };
    }),

  /**
   * Delete a snippet.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(snippets)
        .where(and(eq(snippets.id, input.id), eq(snippets.workspaceId, ctx.workspaceId)));
      return { success: true };
    }),

  /**
   * Toggle favorite status on a snippet.
   */
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const snippet = await ctx.db.query.snippets.findFirst({
        where: and(eq(snippets.id, input.id), eq(snippets.workspaceId, ctx.workspaceId)),
      });

      if (!snippet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Snippet not found" });
      }

      await ctx.db
        .update(snippets)
        .set({ isFavorite: !snippet.isFavorite, updatedAt: new Date() })
        .where(eq(snippets.id, input.id));

      return { isFavorite: !snippet.isFavorite };
    }),
});
