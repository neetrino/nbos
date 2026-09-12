import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const INTERNAL_AUTH_REQUEST_URL = 'http://localhost/internal/interface-locale';

/** Builds a NextRequest that carries the incoming Auth.js cookies into BFF helpers. */
export async function createServerAuthRequest(): Promise<NextRequest> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  return new NextRequest(INTERNAL_AUTH_REQUEST_URL, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}
