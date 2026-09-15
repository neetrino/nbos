import { authJsSessionCookieName } from './authjs-session-token';

/** Expires the encrypted Auth.js session cookie. Allowed BFF write on refresh 401. */
export function buildClearAuthJsSessionCookie(): string {
  const parts = [
    `${authJsSessionCookieName()}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function appendClearedAuthJsSessionCookie(headers: Headers): void {
  headers.append('Set-Cookie', buildClearAuthJsSessionCookie());
}
