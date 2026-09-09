import { describe, expect, it } from 'vitest';
import { DASHBOARD_DESK_FALLBACK_GREETING, deskHeading } from './dashboard-desk-header';

describe('deskHeading', () => {
  it('personalizes the greeting when a name is present', () => {
    expect(deskHeading('Anna')).toBe('Welcome back, Anna');
  });

  it('falls back without a name', () => {
    expect(deskHeading()).toBe(DASHBOARD_DESK_FALLBACK_GREETING);
  });
});
