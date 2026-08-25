import { describe, expect, it } from 'vitest';
import {
  AUTHENTICATED_APP_HOME_PATH,
  getAuthenticatedRootRedirect,
} from './authenticated-root-redirect';

describe('getAuthenticatedRootRedirect', () => {
  it('sends an authenticated visitor from / to the dashboard', () => {
    expect(getAuthenticatedRootRedirect('/', true)).toBe(AUTHENTICATED_APP_HOME_PATH);
  });

  it('leaves guests on the landing page', () => {
    expect(getAuthenticatedRootRedirect('/', false)).toBeNull();
  });

  it('does not redirect other public paths for authenticated users', () => {
    expect(getAuthenticatedRootRedirect('/sign-in', true)).toBeNull();
    expect(getAuthenticatedRootRedirect('/privacy-policy', true)).toBeNull();
  });
});
