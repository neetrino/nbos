import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertTaskDraftDeletable } from './task-lifecycle-guards';

describe('assertTaskDraftDeletable', () => {
  const emptyDraft = {
    status: 'OPEN' as const,
    linkCount: 0,
    checklistCount: 0,
    subtaskCount: 0,
    completedAt: null,
    reviewRequestedAt: null,
  };

  it('allows empty OPEN draft', () => {
    expect(() => assertTaskDraftDeletable(emptyDraft)).not.toThrow();
  });

  it('blocks non-OPEN status', () => {
    expect(() => assertTaskDraftDeletable({ ...emptyDraft, status: 'IN_PROGRESS' })).toThrow(
      ConflictException,
    );
  });

  it('blocks tasks with links', () => {
    expect(() => assertTaskDraftDeletable({ ...emptyDraft, linkCount: 1 })).toThrow(
      ConflictException,
    );
  });

  it('blocks tasks with checklists', () => {
    expect(() => assertTaskDraftDeletable({ ...emptyDraft, checklistCount: 1 })).toThrow(
      ConflictException,
    );
  });

  it('blocks tasks with subtasks', () => {
    expect(() => assertTaskDraftDeletable({ ...emptyDraft, subtaskCount: 1 })).toThrow(
      ConflictException,
    );
  });
});
