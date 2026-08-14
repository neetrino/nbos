import { describe, expect, it } from 'vitest';
import { resolveInlineTitleCommit } from './resolve-inline-title-commit';

describe('resolveInlineTitleCommit', () => {
  it('cancels when draft is empty or whitespace', () => {
    expect(resolveInlineTitleCommit('', 'Alpha')).toEqual({ action: 'cancel' });
    expect(resolveInlineTitleCommit('   ', 'Alpha')).toEqual({ action: 'cancel' });
  });

  it('noops when trimmed draft matches current value', () => {
    expect(resolveInlineTitleCommit('Alpha', 'Alpha')).toEqual({ action: 'noop' });
    expect(resolveInlineTitleCommit('  Alpha  ', 'Alpha')).toEqual({ action: 'noop' });
  });

  it('commits trimmed value when it differs', () => {
    expect(resolveInlineTitleCommit('  Beta  ', 'Alpha')).toEqual({
      action: 'commit',
      value: 'Beta',
    });
  });
});
