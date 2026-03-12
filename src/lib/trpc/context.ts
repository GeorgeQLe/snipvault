import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, workspaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface Context {
  db: typeof db;
  userId: string | null;
  clerkUserId: string | null;
  workspaceId: string | null;
}

/**
 * Create tRPC context from request headers.
 * Resolves the internal user ID and workspace ID from Clerk auth.
 */
export async function createContext(): Promise<Context> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return { db, userId: null, clerkUserId: null, workspaceId: null };
  }

  // Lookup or create user + workspace
  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!user) {
    // Auto-provision user on first request
    const [newUser] = await db
      .insert(users)
      .values({ clerkUserId, email: '' })
      .onConflictDoNothing()
      .returning();

    if (newUser) {
      user = newUser;
      // Create default personal workspace
      await db.insert(workspaces).values({ userId: newUser.id, name: 'Personal' });
    } else {
      user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
      });
    }
  }

  if (!user) {
    return { db, userId: null, clerkUserId, workspaceId: null };
  }

  // Get (or create) workspace
  let workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({ userId: user.id, name: 'Personal' })
      .returning();
    workspace = newWorkspace;
  }

  return {
    db,
    userId: user.id,
    clerkUserId,
    workspaceId: workspace?.id ?? null,
  };
}
