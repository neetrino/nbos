import type { AiPromptVersionStatus } from './prompt-policy-types';
import { isEditablePromptVersionStatus } from './prompt-policy-types';

export type PromptVersionTransition =
  | 'CREATE_DRAFT'
  | 'MARK_TESTING'
  | 'PUBLISH'
  | 'RETIRE'
  | 'ROLLBACK_CLONE';

export type PromptVersionLifecycleDenial =
  | 'NOT_EDITABLE'
  | 'CANNOT_MARK_TESTING'
  | 'CANNOT_PUBLISH'
  | 'CANNOT_RETIRE'
  | 'CANNOT_ROLLBACK';

export function canEditPromptVersion(status: AiPromptVersionStatus): boolean {
  return isEditablePromptVersionStatus(status);
}

export function canMarkPromptVersionTesting(status: AiPromptVersionStatus): boolean {
  return status === 'DRAFT';
}

export function canPublishPromptVersion(status: AiPromptVersionStatus): boolean {
  return status === 'DRAFT' || status === 'TESTING';
}

export function canRetirePromptVersion(status: AiPromptVersionStatus): boolean {
  return status === 'PUBLISHED';
}

/** Rollback clones a previously published (now RETIRED or PUBLISHED) version. */
export function canRollbackFromPromptVersion(status: AiPromptVersionStatus): boolean {
  return status === 'RETIRED' || status === 'PUBLISHED';
}

export function assertPromptVersionTransition(
  status: AiPromptVersionStatus,
  transition: PromptVersionTransition,
): PromptVersionLifecycleDenial | null {
  if (transition === 'CREATE_DRAFT') {
    return null;
  }
  if (transition === 'MARK_TESTING') {
    return canMarkPromptVersionTesting(status) ? null : 'CANNOT_MARK_TESTING';
  }
  if (transition === 'PUBLISH') {
    return canPublishPromptVersion(status) ? null : 'CANNOT_PUBLISH';
  }
  if (transition === 'RETIRE') {
    return canRetirePromptVersion(status) ? null : 'CANNOT_RETIRE';
  }
  return canRollbackFromPromptVersion(status) ? null : 'CANNOT_ROLLBACK';
}
