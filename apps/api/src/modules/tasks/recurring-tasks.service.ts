import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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

const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

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
    this.assertRecurringInput(data);

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const nextCreateAt = this.computeNextCreateAt(
      data.frequency,
      data.interval ?? 1,
      startDate,
      data.daysOfWeek ?? [],
      data.dayOfMonth,
      endDate,
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
        startDate,
        endDate,
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
    const existing = await this.findById(id);
    this.assertRecurringInput(data, existing);
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
    if (data.frequency || data.interval !== undefined || data.startDate || data.daysOfWeek) {
      updateData.lastCreatedAt = null;
    }

    const nextFrequency = data.frequency ?? existing.frequency;
    const nextInterval = data.interval ?? existing.interval;
    const nextStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const nextDaysOfWeek = data.daysOfWeek ?? existing.daysOfWeek;
    const nextDayOfMonth = data.dayOfMonth ?? existing.dayOfMonth ?? undefined;
    const nextEndDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existing.endDate;

    updateData.nextCreateAt = this.computeNextCreateAt(
      nextFrequency,
      nextInterval,
      nextStartDate,
      nextDaysOfWeek,
      nextDayOfMonth,
      nextEndDate,
    );

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
    daysOfWeek: string[],
    dayOfMonth?: number,
    endDate?: Date | null,
  ): Date | null {
    const now = new Date();
    if (endDate && endDate < startDate) return null;

    let next = new Date(startDate);
    if (frequency === 'MONTHLY' && dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayOfMonth, daysInMonth));
    }
    while (next <= now) {
      next = this.advanceOccurrence(next, frequency, interval, daysOfWeek, dayOfMonth);
      if (endDate && next > endDate) return null;
    }
    if (endDate && next > endDate) return null;
    return next;
  }

  private advanceOccurrence(
    baseDate: Date,
    frequency: string,
    interval: number,
    daysOfWeek: string[],
    dayOfMonth?: number,
  ): Date {
    const next = new Date(baseDate);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + interval);
        return next;
      case 'WEEKLY':
        return this.advanceWeekly(next, interval, daysOfWeek);
      case 'MONTHLY':
        return this.advanceMonthly(next, interval, dayOfMonth);
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + interval);
        return next;
      default:
        next.setDate(next.getDate() + interval);
        return next;
    }
  }

  private advanceWeekly(baseDate: Date, interval: number, daysOfWeek: string[]): Date {
    if (daysOfWeek.length === 0) {
      const next = new Date(baseDate);
      next.setDate(next.getDate() + 7 * interval);
      return next;
    }

    const normalized = [...daysOfWeek].map((d) => this.weekdayCodeToIndex(d)).sort((a, b) => a - b);
    const currentIndex = this.weekdayCodeToIndex(this.dateToWeekdayCode(baseDate));
    const sameOrNext = normalized.find((i) => i > currentIndex);

    if (sameOrNext !== undefined) {
      const next = new Date(baseDate);
      next.setDate(next.getDate() + (sameOrNext - currentIndex));
      return next;
    }

    const next = new Date(baseDate);
    const firstInCycle = normalized[0] ?? 0;
    const daysToNextCycle = 7 * interval - currentIndex + firstInCycle;
    next.setDate(next.getDate() + daysToNextCycle);
    return next;
  }

  private advanceMonthly(baseDate: Date, interval: number, dayOfMonth?: number): Date {
    const targetDay =
      dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : baseDate.getDate();
    const next = new Date(baseDate);
    next.setMonth(next.getMonth() + interval, 1);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(targetDay, daysInMonth));
    return next;
  }

  private assertRecurringInput(
    data: CreateRecurringTemplateDto | UpdateRecurringTemplateDto,
    existing?: {
      frequency: string;
      interval: number;
      startDate: Date;
      endDate: Date | null;
      dueDateOffset: number | null;
      daysOfWeek: string[];
      dayOfMonth: number | null;
    },
  ) {
    const frequency = data.frequency ?? existing?.frequency;
    if (
      frequency &&
      !RECURRENCE_FREQUENCIES.includes(frequency as (typeof RECURRENCE_FREQUENCIES)[number])
    ) {
      throw new BadRequestException('frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY.');
    }

    const interval = data.interval ?? existing?.interval ?? 1;
    if (!Number.isInteger(interval) || interval < 1) {
      throw new BadRequestException('interval must be an integer >= 1.');
    }

    const dueDateOffset = data.dueDateOffset ?? existing?.dueDateOffset ?? null;
    if (dueDateOffset !== null && (!Number.isInteger(dueDateOffset) || dueDateOffset < 0)) {
      throw new BadRequestException('dueDateOffset must be an integer >= 0.');
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing?.startDate;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('startDate is required and must be a valid ISO date.');
    }

    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : (existing?.endDate ?? null);
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('endDate must be a valid ISO date.');
    }
    if (endDate && endDate < startDate) {
      throw new BadRequestException('endDate cannot be earlier than startDate.');
    }

    const daysOfWeek = data.daysOfWeek ?? existing?.daysOfWeek ?? [];
    if ((frequency ?? '') === 'WEEKLY') {
      for (const day of daysOfWeek) {
        if (!WEEKDAY_CODES.includes(day as (typeof WEEKDAY_CODES)[number])) {
          throw new BadRequestException('daysOfWeek must use weekday codes: MO,TU,WE,TH,FR,SA,SU.');
        }
      }
    }

    const dayOfMonth = data.dayOfMonth ?? existing?.dayOfMonth ?? null;
    if ((frequency ?? '') === 'MONTHLY' && dayOfMonth !== null) {
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new BadRequestException('dayOfMonth must be an integer between 1 and 31.');
      }
    }
  }

  private weekdayCodeToIndex(code: string): number {
    switch (code) {
      case 'MO':
        return 1;
      case 'TU':
        return 2;
      case 'WE':
        return 3;
      case 'TH':
        return 4;
      case 'FR':
        return 5;
      case 'SA':
        return 6;
      case 'SU':
        return 0;
      default:
        return 0;
    }
  }

  private dateToWeekdayCode(date: Date): string {
    return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()] ?? 'SU';
  }
}
