import type { InputJsonValue, Prisma, TaskPriorityEnum } from '@nbos/database';
import { computeNextCreateAt } from './recurring-task-schedule';
import type { UpdateRecurringTemplateDto } from './recurring-tasks.types';

export function toRecurringJsonInput(value: unknown): InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as InputJsonValue;
}

export function resolveSpawnDueDate(now: Date, dueDateOffset: number | null): string | undefined {
  if (dueDateOffset === null) return undefined;
  const due = new Date(now);
  due.setDate(due.getDate() + dueDateOffset);
  return due.toISOString();
}

export function buildTemplateUpdateData(
  data: UpdateRecurringTemplateDto,
  existing: {
    frequency: string;
    interval: number;
    startDate: Date;
    endDate: Date | null;
    daysOfWeek: string[];
    dayOfMonth: number | null;
  },
): Prisma.RecurringTaskTemplateUncheckedUpdateInput {
  const nextEndDate =
    data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;
  const cadenceChanged = Boolean(
    data.frequency || data.interval !== undefined || data.startDate || data.daysOfWeek,
  );

  return {
    ...pickTemplateFieldUpdates(data),
    ...(cadenceChanged && { lastCreatedAt: null }),
    nextCreateAt: computeNextCreateAt(
      data.frequency ?? existing.frequency,
      data.interval ?? existing.interval,
      data.startDate ? new Date(data.startDate) : existing.startDate,
      data.daysOfWeek ?? existing.daysOfWeek,
      data.dayOfMonth ?? existing.dayOfMonth ?? undefined,
      nextEndDate,
    ),
  };
}

function pickTemplateFieldUpdates(
  data: UpdateRecurringTemplateDto,
): Prisma.RecurringTaskTemplateUncheckedUpdateInput {
  return {
    ...(data.title && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    ...(data.priority && { priority: data.priority as TaskPriorityEnum }),
    ...(data.frequency && { frequency: data.frequency }),
    ...(data.interval !== undefined && { interval: data.interval }),
    ...(data.daysOfWeek && { daysOfWeek: data.daysOfWeek }),
    ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth }),
    ...(data.startDate && { startDate: new Date(data.startDate) }),
    ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    ...(data.dueDateOffset !== undefined && { dueDateOffset: data.dueDateOffset }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.checklistData !== undefined && {
      checklistData: data.checklistData as InputJsonValue,
    }),
    ...(data.linksData !== undefined && { linksData: data.linksData as InputJsonValue }),
  };
}
