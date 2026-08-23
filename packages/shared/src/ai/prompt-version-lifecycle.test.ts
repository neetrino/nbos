import { describe, expect, it } from 'vitest';
import {
  assertPromptVersionTransition,
  canEditPromptVersion,
  canPublishPromptVersion,
  canRollbackFromPromptVersion,
} from './prompt-version-lifecycle';
import { isProductionPromptVersionStatus } from './prompt-policy-types';

describe('prompt version lifecycle', () => {
  it('allows only DRAFT content edits', () => {
    expect(canEditPromptVersion('DRAFT')).toBe(true);
    expect(canEditPromptVersion('TESTING')).toBe(false);
    expect(canEditPromptVersion('PUBLISHED')).toBe(false);
    expect(canEditPromptVersion('RETIRED')).toBe(false);
  });

  it('publishes DRAFT or TESTING and treats only PUBLISHED as production', () => {
    expect(canPublishPromptVersion('DRAFT')).toBe(true);
    expect(canPublishPromptVersion('TESTING')).toBe(true);
    expect(canPublishPromptVersion('PUBLISHED')).toBe(false);
    expect(isProductionPromptVersionStatus('PUBLISHED')).toBe(true);
    expect(isProductionPromptVersionStatus('TESTING')).toBe(false);
  });

  it('rolls back from a previously published version', () => {
    expect(canRollbackFromPromptVersion('RETIRED')).toBe(true);
    expect(canRollbackFromPromptVersion('PUBLISHED')).toBe(true);
    expect(canRollbackFromPromptVersion('DRAFT')).toBe(false);
    expect(assertPromptVersionTransition('DRAFT', 'ROLLBACK_CLONE')).toBe('CANNOT_ROLLBACK');
    expect(assertPromptVersionTransition('RETIRED', 'ROLLBACK_CLONE')).toBeNull();
  });
});
