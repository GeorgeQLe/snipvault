import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchGists } from '@/lib/gists/import';

/**
 * GET /api/gists?token=<pat> — Preview all gists for import.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub personal access token is required' },
      { status: 400 },
    );
  }

  try {
    const gists = await fetchGists(token);
    return NextResponse.json({ gists });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch gists';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
