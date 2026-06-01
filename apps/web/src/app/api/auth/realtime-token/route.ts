import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getBackendAccessToken } from '@/lib/bff-proxy';

/** Short-lived backend JWT for Socket.IO messenger auth (httpOnly session → server fetch). */
export async function GET(req: NextRequest) {
  const accessToken = await getBackendAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ token: accessToken });
}
