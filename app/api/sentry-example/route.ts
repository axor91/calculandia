import { NextResponse } from 'next/server';

export async function GET() {
  try {
    throw new Error('Sentry test error');
  } catch (e) {
    // Если настроен Sentry SDK, он перехватит исключение автоматически
    return NextResponse.json({ ok: true, message: 'Error was thrown for Sentry test' });
  }
}


