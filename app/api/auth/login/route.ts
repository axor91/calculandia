import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionCookie } from '@/lib/auth';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error' }, { status: 400 });
  }
  const { username, password } = parsed.data;

  // Very basic admin auth via env for now
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin';
  if (username !== adminUser || password !== adminPass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const secret = process.env.SESSION_SECRET || 'dev-secret-change';
  const cookie = createSessionCookie(username, secret);
  const res = NextResponse.json({ success: true });
  res.cookies.set('calc_session', cookie, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}


