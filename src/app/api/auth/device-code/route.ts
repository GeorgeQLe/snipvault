import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { deviceCodes } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * POST /api/auth/device-code — Generate a new device code for VS Code auth.
 */
export async function POST() {
  const code = nanoid(8).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  await db.insert(deviceCodes).values({ code, expiresAt });

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}

/**
 * GET /api/auth/device-code?code=XXXX — Poll for auth status.
 * Returns JWT when the code has been authenticated.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

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

  if (deviceCode.authenticatedAt && deviceCode.userId) {
    // Code has been authenticated; return a simple token
    // In production, generate a proper JWT or API key here
    return NextResponse.json({
      status: 'authenticated',
      userId: deviceCode.userId,
      token: `snipvault_${deviceCode.userId}_${Date.now()}`,
    });
  }

  return NextResponse.json({ status: 'pending' });
}
