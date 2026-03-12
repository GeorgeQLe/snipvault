import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { deviceCodes, users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * POST /api/auth/device-code/confirm — Confirm a device code (called from web page).
 */
export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  // Find the device code
  const deviceCode = await db.query.deviceCodes.findFirst({
    where: and(
      eq(deviceCodes.code, code.toUpperCase()),
      gt(deviceCodes.expiresAt, new Date()),
    ),
  });

  if (!deviceCode) {
    return NextResponse.json(
      { error: 'Invalid or expired code' },
      { status: 404 },
    );
  }

  if (deviceCode.authenticatedAt) {
    return NextResponse.json(
      { error: 'Code has already been used' },
      { status: 400 },
    );
  }

  // Find the internal user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Authenticate the device code
  await db
    .update(deviceCodes)
    .set({
      userId: user.id,
      authenticatedAt: new Date(),
    })
    .where(eq(deviceCodes.id, deviceCode.id));

  return NextResponse.json({ success: true });
}
