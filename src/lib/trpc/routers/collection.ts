import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { collections, snippets } from '@/lib/db/schema';
import { eq, and, asc, isNull, sql } from 'drizzle-orm';

export const collectionRouter = router({
  /**
   * List all collections as a flat list (UI builds the tree).
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.collections.findMany({
      where: eq(collections.workspaceId, ctx.workspaceId),
      orderBy: [asc(collections.sortOrder), asc(collections.name)],
    });

    return result;
  }),

  /**
   * List collections as a tree structure.
   */
  tree: protectedProcedure.query(async ({ ctx }) => {
    const allCollections = await ctx.db.query.collections.findMany({
      where: eq(collections.workspaceId, ctx.workspaceId),
      orderBy: [asc(collections.sortOrder), asc(collections.name)],
    });

    // Count snippets per collection
    const counts = await ctx.db
      .select({
        collectionId: snippets.collectionId,
        count: sql<number>`count(*)::int`,
      })
      .from(snippets)
      .where(eq(snippets.workspaceId, ctx.workspaceId))
      .groupBy(snippets.collectionId);

    const countMap = new Map(
      counts.map((c) => [c.collectionId, c.count]),
    );

    type TreeNode = typeof allCollections[number] & {
      children: TreeNode[];
      snippetCount: number;
    };

    const buildTree = (parentId: string | null): TreeNode[] => {
      return allCollections
        .filter((c) =>
          parentId === null ? c.parentId === null : c.parentId === parentId,
        )
        .map((c) => ({
          ...c,
          children: buildTree(c.id),
          snippetCount: countMap.get(c.id) ?? 0,
        }));
    };

    return buildTree(null);
  }),

  /**
   * Get a single collection by ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.query.collections.findFirst({
        where: and(
          eq(collections.id, input.id),
          eq(collections.workspaceId, ctx.workspaceId),
        ),
      });

      if (!collection) {
        throw new Error('Collection not found');
      }

      return collection;
    }),

  /**
   * Create a new collection.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        parentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate parent exists in same workspace
      if (input.parentId) {
        const parent = await ctx.db.query.collections.findFirst({
          where: and(
            eq(collections.id, input.parentId),
            eq(collections.workspaceId, ctx.workspaceId),
          ),
        });
        if (!parent) {
          throw new Error('Parent collection not found');
        }
      }

      // Get max sort order for siblings
      const siblings = await ctx.db.query.collections.findMany({
        where: and(
          eq(collections.workspaceId, ctx.workspaceId),
          input.parentId
            ? eq(collections.parentId, input.parentId)
            : isNull(collections.parentId),
        ),
      });

      const maxOrder = siblings.reduce((max, s) => Math.max(max, s.sortOrder), -1);

      const [collection] = await ctx.db
        .insert(collections)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name,
          description: input.description,
          parentId: input.parentId,
          sortOrder: maxOrder + 1,
        })
        .returning();

      return collection;
    }),

  /**
   * Update a collection.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        parentId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.parentId !== undefined) updates.parentId = input.parentId;

      await ctx.db
        .update(collections)
        .set(updates)
        .where(
          and(
            eq(collections.id, input.id),
            eq(collections.workspaceId, ctx.workspaceId),
          ),
        );

      return { id: input.id };
    }),

  /**
   * Reorder collections within a parent.
   */
  reorder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input.items) {
        await ctx.db
          .update(collections)
          .set({ sortOrder: item.sortOrder })
          .where(
            and(
              eq(collections.id, item.id),
              eq(collections.workspaceId, ctx.workspaceId),
            ),
          );
      }
      return { success: true };
    }),

  /**
   * Delete a collection (snippets are unlinked, not deleted).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Move child collections to parent of deleted collection
      const collection = await ctx.db.query.collections.findFirst({
        where: and(
          eq(collections.id, input.id),
          eq(collections.workspaceId, ctx.workspaceId),
        ),
      });

      if (!collection) {
        throw new Error('Collection not found');
      }

      // Re-parent children
      await ctx.db
        .update(collections)
        .set({ parentId: collection.parentId })
        .where(eq(collections.parentId, input.id));

      // Unlink snippets
      await ctx.db
        .update(snippets)
        .set({ collectionId: null })
        .where(eq(snippets.collectionId, input.id));

      // Delete collection
      await ctx.db.delete(collections).where(eq(collections.id, input.id));

      return { success: true };
    }),
});
