import type { NextConfig } from 'next';
import * as Sentry from '@sentry/nextjs';

function buildCsp() {
  const defaultSrc = ["'self'"];
  const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:', 'http:'];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const imgSrc = ["'self'", 'data:', 'blob:', 'https:'];
  const fontSrc = ["'self'", 'data:'];
  const connectSrc = ["'self'", 'https:', 'http:'];
  // Allowlist extra hosts from env
  const extras = (process.env.CSP_EXTRA_CONNECT || '').split(',').map(s => s.trim()).filter(Boolean);
  connectSrc.push(...extras);
  const extraScript = (process.env.CSP_EXTRA_SCRIPT || '').split(',').map(s => s.trim()).filter(Boolean);
  const extraImg = (process.env.CSP_EXTRA_IMG || '').split(',').map(s => s.trim()).filter(Boolean);
  const frameSrc = ["'self'", ...(process.env.CSP_EXTRA_FRAME || '').split(',').map(s => s.trim()).filter(Boolean)];
  scriptSrc.push(...extraScript);
  imgSrc.push(...extraImg);
  return [
    `default-src ${defaultSrc.join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    'upgrade-insecure-requests',
  ].join('; ');
}

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: buildCsp(),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const baseConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const nextConfig = Sentry.withSentryConfig(baseConfig, {
  silent: true,
});

export default nextConfig;

