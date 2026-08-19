import { describe, expect, it } from 'vitest';
import { resolveMailModuleAccessPhase } from './mail-module-access';

describe('resolveMailModuleAccessPhase', () => {
  it('returns loading while permissions are unresolved', () => {
    expect(resolveMailModuleAccessPhase(true, false)).toBe('loading');
    expect(resolveMailModuleAccessPhase(true, true)).toBe('loading');
  });

  it('returns allowed when permissions loaded and user can view Mail', () => {
    expect(resolveMailModuleAccessPhase(false, true)).toBe('allowed');
  });

  it('returns denied only after permissions loaded without Mail view', () => {
    expect(resolveMailModuleAccessPhase(false, false)).toBe('denied');
  });
});
