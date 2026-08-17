import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type TaskPriorityEnum } from '@nbos/database';
import { employeePersonSelect } from '../../common/employee-person.select';
import { PRISMA_TOKEN } from '../../database.module';
import { assertRecurringInput, computeNextCreateAt } from './recurring-task-schedule';
import {
  parseRecurringChecklistData,
  parseRecurringLinksData,
} from './recurring-task-template-data';
import {
  buildTemplateUpdateData,
  resolveSpawnDueDate,
  toRecurringJsonInput,
} from './recurring-task-update';
import { TasksService } from './tasks.service';
import type {
  CreateRecurringTemplateDto,
  RecurringDueRunResult,
  UpdateRecurringTemplateDto,
} from './recurring-tasks.types';

const TEMPLATE_INCLUDE = {
  creator: { select: employeePersonSelect },
  assignee: { select: employeePersonSelect },
} as const;

@Injectable()
export class RecurringTasksService {
  private readonly logger = new Logger(RecurringTasksService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly tasksService: TasksService,
  ) {}

  async findAll(creatorId?: string) {
    const templates = await this.prisma.recurringTaskTemplate.findMany({
      where: creatorId ? { creatorId } : {},
      include: TEMPLATE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return this.withSpawnedCounts(templates);
  }

  async findById(id: string) {
    const template = await this.prisma.recurringTaskTemplate.findUnique({
      where: { id },
      include: TEMPLATE_INCLUDE,
    });
    if (!template) throw new NotFoundException(`Recurring template ${id} not found`);
    const [withCount] = await this.withSpawnedCounts([template]);
    return withCount ?? { ...template, spawnedTaskCount: 0 };
  }

  async create(data: CreateRecurringTemplateDto) {
    assertRecurringInput(data);
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const nextCreateAt = computeNextCreateAt(
      data.frequency,
      data.interval ?? 1,
      startDate,
      data.daysOfWeek ?? [],
      data.dayOfMonth,
      endDate,
    );

    const created = await this.prisma.recurringTaskTemplate.create({
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
        checklistData: toRecurringJsonInput(data.checklistData),
        linksData: toRecurringJsonInput(data.linksData),
      },
      include: TEMPLATE_INCLUDE,
    });
    return { ...created, spawnedTaskCount: 0 };
  }

  async update(id: string, data: UpdateRecurringTemplateDto) {
    const existing = await this.findById(id);
    assertRecurringInput(data, existing);
    const updateData = buildTemplateUpdateData(data, existing);
    const updated = await this.prisma.recurringTaskTemplate.update({
      where: { id },
      data: updateData,
      include: TEMPLATE_INCLUDE,
    });
    return { ...updated, spawnedTaskCount: existing.spawnedTaskCount };
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.recurringTaskTemplate.delete({ where: { id } });
  }

  async processDueTemplates(): Promise<RecurringDueRunResult> {
    const now = new Date();
    const due = await this.prisma.recurringTaskTemplate.findMany({
      where: { isActive: true, nextCreateAt: { lte: now } },
    });
    const taskIds: string[] = [];
    let failed = 0;
    for (const template of due) {
      try {
        const task = await this.spawnFromTemplate(template, { consumeOccurrence: true });
        taskIds.push(task.id);
      } catch (caught) {
        failed += 1;
        this.logger.error(`Failed to spawn recurring template ${template.id}`, caught);
      }
    }
    return { created: taskIds.length, failed, taskIds };
  }

  async runNow(id: string) {
    const template = await this.prisma.recurringTaskTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`Recurring template ${id} not found`);
    const task = await this.spawnFromTemplate(template, { consumeOccurrence: false });
    const next = await this.findById(id);
    return { template: next, task };
  }

  private async spawnFromTemplate(
    template: {
      id: string;
      title: string;
      description: string | null;
      creatorId: string;
      assigneeId: string | null;
      priority: TaskPriorityEnum;
      frequency: string;
      interval: number;
      daysOfWeek: string[];
      dayOfMonth: number | null;
      startDate: Date;
      endDate: Date | null;
      dueDateOffset: number | null;
      checklistData: unknown;
      linksData: unknown;
    },
    options: { consumeOccurrence: boolean },
  ) {
    const now = new Date();
    const dueDate = resolveSpawnDueDate(now, template.dueDateOffset);
    const task = await this.tasksService.create({
      title: template.title,
      creatorId: template.creatorId,
      description: template.description ?? undefined,
      assigneeId: template.assigneeId ?? undefined,
      priority: template.priority,
      dueDate,
      links: parseRecurringLinksData(template.linksData),
      isRecurring: true,
      templateTaskId: template.id,
    });
    await this.applyDefaultChecklist(task.id, template.checklistData);
    if (options.consumeOccurrence) {
      await this.advanceAfterSpawn(template, now);
    } else {
      await this.prisma.recurringTaskTemplate.update({
        where: { id: template.id },
        data: { lastCreatedAt: now },
      });
    }
    return task;
  }

  private async applyDefaultChecklist(taskId: string, raw: unknown): Promise<void> {
    const checklist = parseRecurringChecklistData(raw);
    if (!checklist) return;
    const created = await this.tasksService.createChecklist(taskId, checklist.title);
    for (const item of checklist.items) {
      await this.tasksService.addChecklistItem(created.id, item);
    }
  }

  private async advanceAfterSpawn(
    template: {
      id: string;
      frequency: string;
      interval: number;
      daysOfWeek: string[];
      dayOfMonth: number | null;
      startDate: Date;
      endDate: Date | null;
    },
    now: Date,
  ): Promise<void> {
    const nextCreateAt = computeNextCreateAt(
      template.frequency,
      template.interval,
      template.startDate,
      template.daysOfWeek,
      template.dayOfMonth ?? undefined,
      template.endDate,
      now,
    );
    await this.prisma.recurringTaskTemplate.update({
      where: { id: template.id },
      data: {
        lastCreatedAt: now,
        nextCreateAt,
        isActive: nextCreateAt !== null,
      },
    });
  }

  private async withSpawnedCounts<T extends { id: string }>(
    templates: T[],
  ): Promise<Array<T & { spawnedTaskCount: number }>> {
    if (templates.length === 0) return [];
    const ids = templates.map((row) => row.id);
    const grouped = await this.prisma.task.groupBy({
      by: ['templateTaskId'],
      where: { templateTaskId: { in: ids }, trashedAt: null },
      _count: { _all: true },
    });
    const counts = new Map(
      grouped
        .filter((row) => row.templateTaskId)
        .map((row) => [row.templateTaskId as string, row._count._all]),
    );
    return templates.map((row) => ({ ...row, spawnedTaskCount: counts.get(row.id) ?? 0 }));
  }
}
