import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { authJsSessionCookieName } from '@/lib/auth/authjs-session-token';

/** Reads the access JWT already stored in the Auth.js cookie. Does not refresh. */
export async function readServerAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  if (!cookieHeader) return undefined;

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    salt: authJsSessionCookieName(),
  });
  return typeof token?.accessToken === 'string' ? token.accessToken : undefined;
}
