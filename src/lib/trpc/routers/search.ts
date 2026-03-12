import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { neon } from '@neondatabase/serverless';
import { generateQueryEmbedding } from '@/lib/ai/embeddings';
import { db } from '@/lib/db';
import { snippets, snippetFiles, snippetTags } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface SearchResult {
  snippetId: string;
  title: string;
  description: string | null;
  language: string | null;
  isFavorite: boolean;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  content: string;
  filename: string;
  combinedScore: number;
  collectionId: string | null;
}

export const searchRouter = router({
  /**
   * Hybrid search combining vector similarity + trigram text search.
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        language: z.string().optional(),
        collectionId: z.string().uuid().optional(),
        tagIds: z.array(z.string().uuid()).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, language, collectionId, tagIds, limit } = input;

      // Generate query embedding
      let queryEmbedding: number[];
      try {
        queryEmbedding = await generateQueryEmbedding(query);
      } catch {
        // Fall back to text-only search if embedding fails
        queryEmbedding = [];
      }

      const sql = neon(process.env.DATABASE_URL!);

      // Build filter clauses
      const filters: string[] = [`s.workspace_id = '${ctx.workspaceId}'`];
      if (language) {
        filters.push(`s.language = '${language}'`);
      }
      if (collectionId) {
        filters.push(`s.collection_id = '${collectionId}'`);
      }

      // Tag filtering
      let tagSnippetIds: string[] | null = null;
      if (tagIds && tagIds.length > 0) {
        const tagResults = await db
          .select({ snippetId: snippetTags.snippetId })
          .from(snippetTags)
          .where(inArray(snippetTags.tagId, tagIds));
        tagSnippetIds = [...new Set(tagResults.map((r) => r.snippetId))];
        if (tagSnippetIds.length === 0) {
          return { results: [] };
        }
        filters.push(`s.id IN (${tagSnippetIds.map((id) => `'${id}'`).join(',')})`);
      }

      const filterClause = filters.join(' AND ');
      const vectorStr = queryEmbedding.length > 0 ? `[${queryEmbedding.join(',')}]` : null;

      // Hybrid search query
      let results: SearchResult[];

      if (vectorStr) {
        // Full hybrid search: vector + trigram
        const rows = await sql`
          WITH vector_search AS (
            SELECT
              sf.snippet_id,
              sf.id as file_id,
              sf.content,
              sf.filename,
              1 - (sf.embedding <=> ${vectorStr}::vector) AS vector_score
            FROM snippet_files sf
            JOIN snippets s ON s.id = sf.snippet_id
            WHERE sf.embedding IS NOT NULL AND ${sql.unsafe(filterClause)}
            ORDER BY sf.embedding <=> ${vectorStr}::vector
            LIMIT 100
          ),
          text_search AS (
            SELECT
              s.id,
              GREATEST(
                similarity(s.title, ${query}),
                similarity(sf.content, ${query})
              ) AS text_score
            FROM snippets s
            JOIN snippet_files sf ON sf.snippet_id = s.id
            WHERE (s.title % ${query} OR sf.content % ${query})
              AND ${sql.unsafe(filterClause)}
          )
          SELECT
            v.snippet_id,
            s.title,
            s.description,
            s.language,
            s.is_favorite,
            s.access_count,
            s.last_accessed_at,
            s.created_at,
            s.collection_id,
            v.content,
            v.filename,
            (
              v.vector_score * 0.7 +
              COALESCE(t.text_score, 0) * 0.3 +
              CASE WHEN s.is_favorite THEN 0.05 ELSE 0 END +
              CASE WHEN s.last_accessed_at > NOW() - INTERVAL '7 days' THEN 0.03 ELSE 0 END
            ) AS combined_score
          FROM vector_search v
          JOIN snippets s ON s.id = v.snippet_id
          LEFT JOIN text_search t ON v.snippet_id = t.id
          ORDER BY combined_score DESC
          LIMIT ${limit}
        `;

        results = rows.map((row: Record<string, unknown>) => ({
          snippetId: row.snippet_id as string,
          title: row.title as string,
          description: row.description as string | null,
          language: row.language as string | null,
          isFavorite: row.is_favorite as boolean,
          accessCount: row.access_count as number,
          lastAccessedAt: row.last_accessed_at as Date | null,
          createdAt: row.created_at as Date,
          collectionId: row.collection_id as string | null,
          content: row.content as string,
          filename: row.filename as string,
          combinedScore: parseFloat(row.combined_score as string),
        }));
      } else {
        // Text-only fallback search
        const rows = await sql`
          SELECT
            s.id AS snippet_id,
            s.title,
            s.description,
            s.language,
            s.is_favorite,
            s.access_count,
            s.last_accessed_at,
            s.created_at,
            s.collection_id,
            sf.content,
            sf.filename,
            GREATEST(
              similarity(s.title, ${query}),
              similarity(sf.content, ${query})
            ) AS combined_score
          FROM snippets s
          JOIN snippet_files sf ON sf.snippet_id = s.id
          WHERE (s.title ILIKE ${'%' + query + '%'} OR sf.content ILIKE ${'%' + query + '%'})
            AND ${sql.unsafe(filterClause)}
          ORDER BY combined_score DESC
          LIMIT ${limit}
        `;

        results = rows.map((row: Record<string, unknown>) => ({
          snippetId: row.snippet_id as string,
          title: row.title as string,
          description: row.description as string | null,
          language: row.language as string | null,
          isFavorite: row.is_favorite as boolean,
          accessCount: row.access_count as number,
          lastAccessedAt: row.last_accessed_at as Date | null,
          createdAt: row.created_at as Date,
          collectionId: row.collection_id as string | null,
          content: row.content as string,
          filename: row.filename as string,
          combinedScore: parseFloat(row.combined_score as string),
        }));
      }

      return { results };
    }),

  /**
   * Find similar snippets (5 nearest neighbors) for a given snippet.
   */
  similar: protectedProcedure
    .input(z.object({ snippetId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const sql = neon(process.env.DATABASE_URL!);

      const rows = await sql`
        WITH target AS (
          SELECT embedding
          FROM snippet_files
          WHERE snippet_id = ${input.snippetId}
          AND embedding IS NOT NULL
          LIMIT 1
        )
        SELECT
          s.id AS snippet_id,
          s.title,
          s.description,
          s.language,
          sf.content,
          1 - (sf.embedding <=> (SELECT embedding FROM target)) AS similarity_score
        FROM snippet_files sf
        JOIN snippets s ON s.id = sf.snippet_id
        WHERE sf.embedding IS NOT NULL
          AND s.workspace_id = ${ctx.workspaceId}
          AND sf.snippet_id != ${input.snippetId}
          AND (SELECT embedding FROM target) IS NOT NULL
        ORDER BY sf.embedding <=> (SELECT embedding FROM target)
        LIMIT 5
      `;

      return rows.map((row: Record<string, unknown>) => ({
        snippetId: row.snippet_id as string,
        title: row.title as string,
        description: row.description as string | null,
        language: row.language as string | null,
        content: (row.content as string).slice(0, 200),
        similarityScore: parseFloat(row.similarity_score as string),
      }));
    }),
});
