import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, workspaces, collections, snippets, snippetFiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchGistFileContent } from '@/lib/gists/import';
import { detectLanguage } from '@/lib/language-detection';
import { autoTagSnippet } from '@/lib/ai/tagging';
import { generateEmbedding } from '@/lib/ai/embeddings';

interface ImportRequest {
  token: string;
  gists: Array<{
    id: string;
    description: string | null;
    files: Array<{
      filename: string;
      language: string | null;
      raw_url: string;
    }>;
  }>;
}

/**
 * POST /api/gists/import — Import selected gists as snippets.
 */
export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: ImportRequest = await request.json();
  const { token, gists } = body;

  if (!token || !gists || gists.length === 0) {
    return NextResponse.json(
      { error: 'Token and gists are required' },
      { status: 400 },
    );
  }

  // Find user and workspace
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Find or create "Imported from Gists" collection
  let importCollection = await db.query.collections.findFirst({
    where: and(
      eq(collections.workspaceId, workspace.id),
      eq(collections.name, 'Imported from Gists'),
    ),
  });

  if (!importCollection) {
    const [created] = await db
      .insert(collections)
      .values({
        workspaceId: workspace.id,
        name: 'Imported from Gists',
        description: 'Snippets imported from GitHub Gists',
      })
      .returning();
    importCollection = created;
  }

  const results: Array<{ gistId: string; snippetId: string; title: string }> = [];
  const errors: Array<{ gistId: string; error: string }> = [];

  for (const gist of gists) {
    try {
      const firstFile = gist.files[0];
      if (!firstFile) continue;

      // Fetch file content
      const content = await fetchGistFileContent(firstFile.raw_url, token);

      const detectedLang =
        firstFile.language ||
        detectLanguage(content, firstFile.filename) ||
        null;

      const title =
        gist.description || firstFile.filename || `Gist ${gist.id.slice(0, 8)}`;

      // Create snippet
      const [snippet] = await db
        .insert(snippets)
        .values({
          workspaceId: workspace.id,
          collectionId: importCollection.id,
          title,
          description: gist.description,
          language: detectedLang,
          source: 'gist_import',
        })
        .returning();

      // Create snippet file
      const [file] = await db
        .insert(snippetFiles)
        .values({
          snippetId: snippet.id,
          filename: firstFile.filename,
          content,
          language: detectedLang,
        })
        .returning();

      results.push({ gistId: gist.id, snippetId: snippet.id, title });

      // Background AI processing
      Promise.all([
        autoTagSnippet(snippet.id, workspace.id, title, content, detectedLang, gist.description),
        generateEmbedding(file.id, title, gist.description, detectedLang, content),
      ]).catch((err) => {
        console.error(`[Gist Import] AI processing failed for gist ${gist.id}:`, err);
      });
    } catch (error) {
      errors.push({
        gistId: gist.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ imported: results, errors });
}
