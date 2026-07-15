import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from './lib/auth-edge';

// Rate limiter с автоочисткой (пункт 7: фикс memory leak)
const globalAny = globalThis as unknown as {
  __rl?: Map<string, { count: number; ts: number }>;
  __rl_cleanup?: number;
};
if (!globalAny.__rl) globalAny.__rl = new Map();
const RL_LIMIT = 60;
const RL_WINDOW_MS = 60_000;
const RL_CLEANUP_INTERVAL_MS = 5 * 60_000;

function cleanupRateLimiter() {
  const store = globalAny.__rl!;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.ts > RL_WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}

// (#34, #35): CSP без unsafe-inline/unsafe-eval — используем nonce
// (#40): HSTS заголовок для HTTPS
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  const cspExtra = process.env.CSP_EXTRA_CONNECT || '';

  // CSP: script-src с nonce вместо unsafe-inline/unsafe-eval
  // style-src: unsafe-inline пока необходим для Tailwind CSS (inline styles)
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: https:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://www.google-analytics.com https://isdayoff.ru${cspExtra ? ' ' + cspExtra : ''}`,
    `frame-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // (#40): HSTS — только в production  
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

// Генерация nonce для CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let hex = '';
  for (let i = 0; i < array.length; i++) hex += array[i].toString(16).padStart(2, '0');
  return hex;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = generateNonce();

  // Периодическая очистка rate limiter (каждые 5 мин)
  const now = Date.now();
  if (!globalAny.__rl_cleanup || now - globalAny.__rl_cleanup > RL_CLEANUP_INTERVAL_MS) {
    globalAny.__rl_cleanup = now;
    cleanupRateLimiter();
  }

  const isPublicApiGet = pathname.startsWith('/api/calculators') && req.method === 'GET';
  if (isPublicApiGet) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.nextUrl.hostname ||
      'unknown';
    const store = globalAny.__rl!;
    const entry = store.get(ip) || { count: 0, ts: now };
    if (now - entry.ts > RL_WINDOW_MS) {
      entry.count = 0;
      entry.ts = now;
    }
    entry.count += 1;
    store.set(ip, entry);
    if (entry.count > RL_LIMIT) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }
  }

  // Protect admin page and calculators admin API
  const isAdminPath = pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/calculators') && req.method !== 'GET';
  if ((isAdminPath && !pathname.startsWith('/login')) || isProtectedApi) {
    const cookie = req.cookies.get('calc_session')?.value;
    const secret = process.env.SESSION_SECRET || 'dev-secret-change';
    const session = await verifySessionCookie(cookie, secret);
    if (!session) {
      if (isAdminPath) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const response = NextResponse.next();
  // Добавляем заголовки безопасности ко всем ответам
  addSecurityHeaders(response, nonce);
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/calculators/:path*', '/api/auth/:path*', '/login', '/', '/calculator/:path*'],
};
