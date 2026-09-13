import { describe, expect, it } from 'vitest';
import { resolveModuleAccessDecision } from './module-access-decision';

const BASE = {
  hasRequirement: true,
  isLoading: false,
  meLoadError: null,
  isPermitted: true,
};

describe('resolveModuleAccessDecision', () => {
  it('renders an unguarded route', () => {
    expect(
      resolveModuleAccessDecision({ ...BASE, hasRequirement: false, isPermitted: false }),
    ).toBe('ALLOW');
  });

  it('waits while permissions are loading', () => {
    expect(resolveModuleAccessDecision({ ...BASE, isLoading: true, isPermitted: false })).toBe(
      'LOADING',
    );
  });

  it('does not open a gated route when permissions failed to load', () => {
    expect(
      resolveModuleAccessDecision({ ...BASE, meLoadError: 'offline', isPermitted: false }),
    ).toBe('ERROR');
  });

  it('reports the load failure instead of an access denial even for a permitted user', () => {
    expect(resolveModuleAccessDecision({ ...BASE, meLoadError: 'offline' })).toBe('ERROR');
  });

  it('allows a permitted user', () => {
    expect(resolveModuleAccessDecision(BASE)).toBe('ALLOW');
  });

  it('denies a user without the permission', () => {
    expect(resolveModuleAccessDecision({ ...BASE, isPermitted: false })).toBe('DENY');
  });
});
