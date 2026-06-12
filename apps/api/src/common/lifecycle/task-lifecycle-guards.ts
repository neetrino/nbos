import { ConflictException } from '@nestjs/common';
import type { TaskStatusEnum } from '@nbos/database';

/** Profile O1: empty OPEN draft hard-delete; other tasks move to Trash via trashedAt. */

export interface TaskDraftDeleteInput {
  status: TaskStatusEnum;
  linkCount: number;
  checklistCount: number;
  subtaskCount: number;
  completedAt: Date | null;
  reviewRequestedAt?: Date | null;
}

export function isTaskDraftDeletable(input: TaskDraftDeleteInput): boolean {
  if (input.status !== 'OPEN') return false;
  if (input.completedAt != null) return false;
  if (input.reviewRequestedAt != null) return false;
  if (input.linkCount > 0) return false;
  if (input.checklistCount > 0) return false;
  if (input.subtaskCount > 0) return false;
  return true;
}

export function assertTaskDraftDeletable(input: TaskDraftDeleteInput): void {
  if (input.status !== 'OPEN') {
    throw new ConflictException(
      'Only draft tasks (status OPEN) can be deleted. Complete or manage the task via workflow instead.',
    );
  }
  if (input.completedAt != null) {
    throw new ConflictException('Completed tasks cannot be deleted.');
  }
  if (input.reviewRequestedAt != null) {
    throw new ConflictException('Tasks in review cannot be deleted.');
  }
  if (input.linkCount > 0) {
    throw new ConflictException('Tasks with entity links cannot be deleted. Remove links first.');
  }
  if (input.checklistCount > 0) {
    throw new ConflictException('Tasks with checklists cannot be deleted.');
  }
  if (input.subtaskCount > 0) {
    throw new ConflictException('Tasks with subtasks cannot be deleted.');
  }
}
