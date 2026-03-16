import OpenAI from 'openai';
import pLimit from 'p-limit';
import { neon } from '@neondatabase/serverless';

const embeddingLimit = pLimit(5);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_INPUT_CHARS = 8000;

/**
 * Build composite text for embedding generation.
 */
function buildEmbeddingInput(
  title: string,
  description: string | null,
  language: string | null,
  content: string,
): string {
  const parts = [title];

  if (description) {
    parts.push(description);
  }

  if (language) {
    parts.push(`Language: ${language}`);
  }

  parts.push(content);

  const composite = parts.join('\n\n');
  return composite.slice(0, MAX_INPUT_CHARS);
}

/**
 * Generate an embedding vector using OpenAI text-embedding-3-small.
 */
async function generateEmbeddingVector(text: string): Promise<number[]> {
  return embeddingLimit(async () => {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  });
}

/**
 * Store embedding vector for a snippet file using raw SQL (pgvector).
 */
async function storeEmbedding(
  snippetFileId: string,
  embedding: number[],
): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  const vectorStr = `[${embedding.join(',')}]`;

  await sql`UPDATE snippet_files SET embedding = ${vectorStr}::vector WHERE id = ${snippetFileId}`;
}

/**
 * Generate and store embedding for a snippet file.
 * Called after snippet creation/update.
 */
export async function generateEmbedding(
  snippetFileId: string,
  title: string,
  description: string | null,
  language: string | null,
  content: string,
): Promise<void> {
  try {
    const input = buildEmbeddingInput(title, description, language, content);
    const embedding = await generateEmbeddingVector(input);
    await storeEmbedding(snippetFileId, embedding);
  } catch (error) {
    // Log but don't throw — embedding is a background enhancement
    console.error('[Embeddings] Failed to generate embedding for file:', snippetFileId, error);
  }
}

/**
 * Generate an embedding vector for a search query.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return generateEmbeddingVector(query.slice(0, MAX_INPUT_CHARS));
}
