import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type TaskPriorityEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CreateRecurringTemplateDto {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  frequency: string;
  interval?: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  dueDateOffset?: number;
  checklistData?: unknown;
  linksData?: unknown;
}

interface UpdateRecurringTemplateDto {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  priority?: string;
  frequency?: string;
  interval?: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string | null;
  dueDateOffset?: number | null;
  isActive?: boolean;
  checklistData?: unknown;
  linksData?: unknown;
}

@Injectable()
export class RecurringTasksService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(creatorId?: string) {
    const where = creatorId ? { creatorId } : {};
    return this.prisma.recurringTaskTemplate.findMany({
      where,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const template = await this.prisma.recurringTaskTemplate.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!template) throw new NotFoundException(`Recurring template ${id} not found`);
    return template;
  }

  async create(data: CreateRecurringTemplateDto) {
    const nextCreateAt = this.computeNextCreateAt(
      data.frequency,
      data.interval ?? 1,
      new Date(data.startDate),
      data.daysOfWeek ?? [],
      data.dayOfMonth,
    );

    return this.prisma.recurringTaskTemplate.create({
      data: {
        title: data.title,
        creatorId: data.creatorId,
        description: data.description,
        assigneeId: data.assigneeId,
        priority: (data.priority as TaskPriorityEnum) ?? 'NORMAL',
        frequency: data.frequency,
        interval: data.interval ?? 1,
        daysOfWeek: data.daysOfWeek ?? [],
        dayOfMonth: data.dayOfMonth,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        dueDateOffset: data.dueDateOffset,
        nextCreateAt,
        checklistData: (data.checklistData as any) ?? undefined,
        linksData: (data.linksData as any) ?? undefined,
      },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateRecurringTemplateDto) {
    await this.findById(id);
    const updateData: Prisma.RecurringTaskTemplateUncheckedUpdateInput = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.priority) updateData.priority = data.priority as TaskPriorityEnum;
    if (data.frequency) updateData.frequency = data.frequency;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.daysOfWeek) updateData.daysOfWeek = data.daysOfWeek;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.dueDateOffset !== undefined) updateData.dueDateOffset = data.dueDateOffset;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.checklistData !== undefined) updateData.checklistData = data.checklistData as any;
    if (data.linksData !== undefined) updateData.linksData = data.linksData as any;

    return this.prisma.recurringTaskTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.recurringTaskTemplate.delete({ where: { id } });
  }

  /**
   * Вычисляет следующую дату создания задачи.
   * Упрощённая логика — в будущем можно расширить для cron-like поведения.
   */
  private computeNextCreateAt(
    frequency: string,
    interval: number,
    startDate: Date,
    _daysOfWeek: string[],
    _dayOfMonth?: number,
  ): Date {
    const now = new Date();
    const next = new Date(startDate);

    while (next <= now) {
      switch (frequency) {
        case 'DAILY':
          next.setDate(next.getDate() + interval);
          break;
        case 'WEEKLY':
          next.setDate(next.getDate() + 7 * interval);
          break;
        case 'MONTHLY':
          next.setMonth(next.getMonth() + interval);
          break;
        case 'YEARLY':
          next.setFullYear(next.getFullYear() + interval);
          break;
        default:
          next.setDate(next.getDate() + interval);
      }
    }

    return next;
  }
}
