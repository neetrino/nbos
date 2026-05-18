import { describe, expect, it } from 'vitest';

import { normalizeTaskStatusForDraft } from './task-status-draft';

describe('normalizeTaskStatusForDraft', () => {
  it('maps legacy NEW and DONE to canonical workflow values', () => {
    expect(normalizeTaskStatusForDraft('NEW')).toBe('OPEN');
    expect(normalizeTaskStatusForDraft('DONE')).toBe('COMPLETED');
    expect(normalizeTaskStatusForDraft('REVIEW')).toBe('REVIEW');
  });
});
