import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { tags, snippetTags } from '@/lib/db/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';

export const tagRouter = router({
  /**
   * List all tags with usage counts.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        workspaceId: tags.workspaceId,
        createdAt: tags.createdAt,
        usageCount: sql<number>`count(${snippetTags.snippetId})::int`,
      })
      .from(tags)
      .leftJoin(snippetTags, eq(tags.id, snippetTags.tagId))
      .where(eq(tags.workspaceId, ctx.workspaceId))
      .groupBy(tags.id)
      .orderBy(sql`count(${snippetTags.snippetId}) DESC`);

    return result;
  }),

  /**
   * Search tags by name.
   */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.tags.findMany({
        where: and(
          eq(tags.workspaceId, ctx.workspaceId),
          ilike(tags.name, `%${input.query}%`),
        ),
        limit: 20,
      });

      return result;
    }),

  /**
   * Create a new tag.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.enum(['blue', 'green', 'purple', 'gray', 'red', 'yellow', 'orange', 'pink']).default('gray'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [tag] = await ctx.db
        .insert(tags)
        .values({
          workspaceId: ctx.workspaceId,
          name: input.name.toLowerCase().trim(),
          color: input.color,
        })
        .onConflictDoNothing()
        .returning();

      if (!tag) {
        // Already exists
        const existing = await ctx.db.query.tags.findFirst({
          where: and(
            eq(tags.workspaceId, ctx.workspaceId),
            eq(tags.name, input.name.toLowerCase().trim()),
          ),
        });
        return existing!;
      }

      return tag;
    }),

  /**
   * Update a tag.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(50).optional(),
        color: z.enum(['blue', 'green', 'purple', 'gray', 'red', 'yellow', 'orange', 'pink']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name.toLowerCase().trim();
      if (input.color !== undefined) updates.color = input.color;

      await ctx.db
        .update(tags)
        .set(updates)
        .where(
          and(eq(tags.id, input.id), eq(tags.workspaceId, ctx.workspaceId)),
        );

      return { id: input.id };
    }),

  /**
   * Delete a tag.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tags)
        .where(
          and(eq(tags.id, input.id), eq(tags.workspaceId, ctx.workspaceId)),
        );
      return { success: true };
    }),
});
