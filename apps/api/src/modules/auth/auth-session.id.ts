import { randomBytes } from 'node:crypto';

/** Cuid-like opaque id without extra dependency. */
export function createId(): string {
  return `c${randomBytes(12).toString('base64url')}`;
}
