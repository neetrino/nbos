import { ConflictException } from '@nestjs/common';
import type { TaskStatusEnum } from '@nbos/database';

/** Profile draft-only delete for tasks (O1 — trash deferred). */

export interface TaskDraftDeleteInput {
  status: TaskStatusEnum;
  linkCount: number;
  checklistCount: number;
  subtaskCount: number;
  completedAt: Date | null;
  reviewRequestedAt?: Date | null;
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
