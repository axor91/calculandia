import crypto from 'crypto';

type SessionPayload = {
  sub: string; // username
  role: 'admin';
  iat: number;
  exp: number;
};

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function hmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function createSessionCookie(username: string, secret: string, ttlSeconds = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: username, role: 'admin', iat: now, exp: now + ttlSeconds };
  const encoded = base64url(JSON.stringify(payload));
  const sig = hmac(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifySessionCookie(cookieValue: string | undefined, secret: string): SessionPayload | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = hmac(encoded, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const json = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}


