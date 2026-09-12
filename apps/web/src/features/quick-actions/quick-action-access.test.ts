import { describe, expect, it } from 'vitest';
import { canUseQuickTaskSurface } from './quick-action-access';

describe('quick-action-access', () => {
  it('does not block the form while permissions are still loading', () => {
    expect(canUseQuickTaskSurface(true, null, false)).toBe(true);
  });

  it('denies the Tasks surface after load when VIEW is missing', () => {
    expect(canUseQuickTaskSurface(false, null, false)).toBe(false);
    expect(canUseQuickTaskSurface(false, null, true)).toBe(true);
  });
});
