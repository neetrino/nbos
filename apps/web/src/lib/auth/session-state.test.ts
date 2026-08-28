import { describe, expect, it } from 'vitest';
import { hasInvalidSessionHeader, shouldSignOutForResponse } from './session-state';

describe('session invalid response classification', () => {
  it('accepts both Headers-like and Axios-like header containers', () => {
    expect(hasInvalidSessionHeader(new Headers({ 'X-Nbos-Session-Invalid': '1' }))).toBe(true);
    expect(hasInvalidSessionHeader({ 'x-nbos-session-invalid': '1' })).toBe(true);
  });

  it('signs out only for a BFF-confirmed invalid-session 401', () => {
    expect(shouldSignOutForResponse(401, { 'x-nbos-session-invalid': '1' })).toBe(true);
    expect(shouldSignOutForResponse(401, {})).toBe(false);
    expect(shouldSignOutForResponse(429, { 'x-nbos-session-invalid': '1' })).toBe(false);
    expect(shouldSignOutForResponse(503, {})).toBe(false);
  });
});
