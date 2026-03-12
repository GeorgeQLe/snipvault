import OpenAI from 'openai';
import { db } from '@/lib/db';
import { tags, snippetTags, snippets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TaggingResult {
  language: string | null;
  frameworks: string[];
  purposes: string[];
  description: string | null;
}

const TAG_COLORS: Record<string, string> = {
  language: 'blue',
  framework: 'green',
  purpose: 'purple',
};

/**
 * Analyze code content with GPT-4o-mini and return structured tag suggestions.
 */
async function analyzeCode(
  title: string,
  content: string,
  existingLanguage?: string | null,
): Promise<TaggingResult> {
  const truncatedContent = content.slice(0, 4000);

  const prompt = `Analyze this code snippet and return a JSON object with:
- "language": the programming language (e.g., "javascript", "python", "go") or null if unclear
- "frameworks": array of frameworks/libraries used (e.g., ["react", "next.js", "express"]), max 5
- "purposes": array of what this code does (e.g., ["authentication", "api-endpoint", "data-fetching"]), max 3
- "description": a brief one-sentence description of what this code does, or null if unclear

Title: ${title}
${existingLanguage ? `Known language: ${existingLanguage}` : ''}

Code:
\`\`\`
${truncatedContent}
\`\`\`

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 300,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return { language: null, frameworks: [], purposes: [], description: null };
  }

  try {
    const parsed = JSON.parse(text);
    return {
      language: typeof parsed.language === 'string' ? parsed.language.toLowerCase() : null,
      frameworks: Array.isArray(parsed.frameworks)
        ? parsed.frameworks.filter((f: unknown) => typeof f === 'string').slice(0, 5)
        : [],
      purposes: Array.isArray(parsed.purposes)
        ? parsed.purposes.filter((p: unknown) => typeof p === 'string').slice(0, 3)
        : [],
      description: typeof parsed.description === 'string' ? parsed.description : null,
    };
  } catch {
    return { language: null, frameworks: [], purposes: [], description: null };
  }
}

/**
 * Retry wrapper with exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Find or create a tag in the workspace.
 */
async function findOrCreateTag(
  workspaceId: string,
  name: string,
  color: string,
): Promise<string> {
  const normalizedName = name.toLowerCase().trim();

  const existing = await db.query.tags.findFirst({
    where: and(eq(tags.workspaceId, workspaceId), eq(tags.name, normalizedName)),
  });

  if (existing) return existing.id;

  const [created] = await db
    .insert(tags)
    .values({ workspaceId, name: normalizedName, color })
    .onConflictDoNothing()
    .returning();

  if (created) return created.id;

  // Race condition: another request created it
  const found = await db.query.tags.findFirst({
    where: and(eq(tags.workspaceId, workspaceId), eq(tags.name, normalizedName)),
  });

  return found!.id;
}

/**
 * Auto-tag a snippet using AI analysis. Runs after snippet creation/update.
 */
export async function autoTagSnippet(
  snippetId: string,
  workspaceId: string,
  title: string,
  content: string,
  existingLanguage?: string | null,
  existingDescription?: string | null,
): Promise<void> {
  try {
    const result = await withRetry(() =>
      analyzeCode(title, content, existingLanguage),
    );

    // Remove existing AI-generated tags
    const existingAiTags = await db.query.snippetTags.findMany({
      where: and(eq(snippetTags.snippetId, snippetId), eq(snippetTags.source, 'ai')),
    });

    if (existingAiTags.length > 0) {
      for (const st of existingAiTags) {
        await db
          .delete(snippetTags)
          .where(
            and(eq(snippetTags.snippetId, snippetId), eq(snippetTags.tagId, st.tagId)),
          );
      }
    }

    // Create tags from AI results
    const tagEntries: Array<{ name: string; color: string }> = [];

    if (result.language) {
      tagEntries.push({ name: result.language, color: TAG_COLORS.language });
    }

    for (const framework of result.frameworks) {
      tagEntries.push({ name: framework, color: TAG_COLORS.framework });
    }

    for (const purpose of result.purposes) {
      tagEntries.push({ name: purpose, color: TAG_COLORS.purpose });
    }

    // Persist tags
    for (const entry of tagEntries) {
      const tagId = await findOrCreateTag(workspaceId, entry.name, entry.color);
      await db
        .insert(snippetTags)
        .values({ snippetId, tagId, source: 'ai' })
        .onConflictDoNothing();
    }

    // Update snippet language and description if not already set
    const updates: Record<string, unknown> = {};
    if (!existingLanguage && result.language) {
      updates.language = result.language;
    }
    if (!existingDescription && result.description) {
      updates.description = result.description;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(snippets).set(updates).where(eq(snippets.id, snippetId));
    }
  } catch (error) {
    // Log but don't throw — tagging is a background enhancement
    console.error('[AI Tagging] Failed to auto-tag snippet:', snippetId, error);
  }
}
