import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_DESK_FALLBACK_GREETING,
  DASHBOARD_DESK_FALLBACK_SUBLINE,
  deskCopy,
} from './dashboard-desk-header';

describe('deskCopy', () => {
  it('uses the stable neutral pair without a profile', () => {
    const copy = deskCopy(null);
    expect(copy.title).toBe(DASHBOARD_DESK_FALLBACK_GREETING);
    expect(copy.subline).toBe(DASHBOARD_DESK_FALLBACK_SUBLINE);
    expect(copy.templateId).toBe('fallback-peaceful');
  });

  it('returns a wish rather than a time of day', () => {
    const copy = deskCopy(
      { employeeId: 'emp-anna', firstName: 'Anna' },
      new Date('2026-09-16T08:00:00.000Z'),
    );
    expect(copy.title).not.toMatch(/Welcome back|Good afternoon|Afternoon,/iu);
    expect(copy.templateId.length).toBeGreaterThan(3);
    expect(copy.icon).toBeTruthy();
  });
});
