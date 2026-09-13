import { describe, expect, it } from 'vitest';
import { createQuickCreateChecklist } from './quick-create-checklist-draft';
import { newQuickCreateDraftId } from './quick-create-task-extras';

describe('newQuickCreateDraftId', () => {
  it('makes unique local keys without Web Crypto', () => {
    expect(newQuickCreateDraftId()).not.toBe(newQuickCreateDraftId());
    expect(createQuickCreateChecklist([]).localId).toMatch(/^qc-draft-\d+$/);
  });
});
