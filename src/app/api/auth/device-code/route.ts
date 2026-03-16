import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { deviceCodes } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// In-memory rate limiter (10 req/min/IP)
// ---------------------------------------------------------------------------
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 10;
}

/**
 * POST /api/auth/device-code — Generate a new device code for VS Code auth.
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 },
    );
  }

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
