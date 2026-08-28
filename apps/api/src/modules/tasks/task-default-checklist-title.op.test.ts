import { describe, expect, it } from 'vitest';
import {
  nextDefaultChecklistTitle,
  resolveChecklistTitle,
} from './task-default-checklist-title.op';

describe('nextDefaultChecklistTitle', () => {
  it('starts at Checklist 1 when none exist', () => {
    expect(nextDefaultChecklistTitle([])).toBe('Checklist 1');
  });

  it('uses the next unused number', () => {
    expect(nextDefaultChecklistTitle(['Checklist 1'])).toBe('Checklist 2');
    expect(nextDefaultChecklistTitle(['Checklist 1', 'Checklist 2'])).toBe('Checklist 3');
  });

  it('reuses a gap after a numbered title is removed', () => {
    expect(nextDefaultChecklistTitle(['Checklist 2'])).toBe('Checklist 1');
  });

  it('ignores custom titles', () => {
    expect(nextDefaultChecklistTitle(['QA', 'Launch'])).toBe('Checklist 1');
  });
});

describe('resolveChecklistTitle', () => {
  it('keeps an explicit title', () => {
    expect(resolveChecklistTitle('  QA  ', ['Checklist 1'])).toBe('QA');
  });

  it('falls back to the next default when title is blank', () => {
    expect(resolveChecklistTitle('   ', ['Checklist 1'])).toBe('Checklist 2');
    expect(resolveChecklistTitle(undefined, [])).toBe('Checklist 1');
  });
});
