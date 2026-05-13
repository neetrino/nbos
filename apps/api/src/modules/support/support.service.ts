import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TaskPriorityEnum,
  type PaymentTypeEnum,
  type SupportCoverageEnum,
  type TicketStatusEnum,
  type TicketPriorityEnum,
  type TicketCategoryEnum,
  type TicketWaitingStateEnum,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildSupportSlaProjection } from './support-sla';
import {
  buildPauseFieldsAfterWaitingChange,
  resetPauseForSlaRecalculation,
} from './support-sla-pause';
import { resolveSupportSlaNotificationRecipientIds } from './support-sla-recipients';
import { assertSupportTechnicalLinksValid } from './support-technical-link.validation';
import { parseSupportTicketCloseReason } from './support-close-reason.parse';
import {
  MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH,
  SUPPORT_EXTENSION_DELIVERED_RESOLUTION_SUMMARY,
} from './support-ticket-status.constants';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';

const SLA_DEADLINES: Record<string, { responseHours: number; resolveHours: number }> = {
  P1: { responseHours: 4, resolveHours: 24 },
  P2: { responseHours: 8, resolveHours: 48 },
  P3: { responseHours: 24, resolveHours: 72 },
};

const SUPPORT_TICKET_ENTITY_TYPE = 'SUPPORT_TICKET';
const PROJECT_ENTITY_TYPE = 'PROJECT';
const PRODUCT_ENTITY_TYPE = 'PRODUCT';

function assertTicketWaitingState(value: string): TicketWaitingStateEnum {
  if (
    value === 'NONE' ||
    value === 'WAITING_FOR_CLIENT' ||
    value === 'WAITING_FOR_THIRD_PARTY' ||
    value === 'ESCALATED'
  ) {
    return value;
  }
  throw new BadRequestException('Invalid waitingState value.');
}

const MANAGER_ESCALATION_NOTIFICATION = 'support.escalation.manager';

const TICKET_PRIORITY_TO_TASK_PRIORITY: Record<TicketPriorityEnum, TaskPriorityEnum> = {
  P1: 'CRITICAL',
  P2: 'HIGH',
  P3: 'NORMAL',
};

const SUPPORT_TICKET_INCLUDE = {
  project: { select: { id: true, code: true, name: true } },
  product: { select: { id: true, name: true, status: true } },
  extensionDeal: { select: { id: true, code: true, name: true, status: true, amount: true } },
  contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  technicalAsset: {
    select: { id: true, name: true, type: true, status: true, environment: true },
  },
  technicalEnvironment: {
    select: { id: true, name: true, kind: true, status: true },
  },
} satisfies Prisma.SupportTicketInclude;

const SUPPORT_TASK_INCLUDE = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  links: true,
  checklists: { include: { items: { orderBy: { sortOrder: 'asc' as const } } } },
  subtasks: {
    select: { id: true, code: true, title: true, status: true, assigneeId: true },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { subtasks: true, checklists: true } },
} satisfies Prisma.TaskInclude;

interface CreateTicketDto {
  title: string;
  projectId: string;
  category?: string;
  description?: string;
  productId?: string;
  coverageDecision?: string | null;
  contactId?: string;
  priority?: string;
  billable?: boolean;
  assignedTo?: string;
  technicalAssetId?: string | null;
  technicalEnvironmentId?: string | null;
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  resolutionSummary?: string | null;
  projectId?: string;
  productId?: string | null;
  contactId?: string;
  category?: string;
  coverageDecision?: string | null;
  priority?: string;
  billable?: boolean;
  assignedTo?: string;
  technicalAssetId?: string | null;
  technicalEnvironmentId?: string | null;
}

interface TicketQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  coverageDecision?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  waitingState?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateTicketTaskDto {
  creatorId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
}

interface CreateExtensionDealDto {
  sellerId: string;
  contactId?: string;
  amount?: number;
  paymentType?: string;
  name?: string;
  notes?: string;
}

@Injectable()
export class SupportService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(params: TicketQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      productId,
      status,
      priority,
      category,
      coverageDecision,
      assignedTo,
      waitingState,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhere({
      projectId,
      productId,
      status,
      priority,
      category,
      coverageDecision,
      assignedTo,
      waitingState,
      search,
    });

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: SUPPORT_TICKET_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items: items.map((ticket) => this.attachSla(ticket)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    const executionTasks = await this.findExecutionTasks(id);
    return { ...this.attachSla(ticket), executionTasks };
  }

  async create(data: CreateTicketDto) {
    const code = await this.generateCode();
    const priority = (data.priority as TicketPriorityEnum) ?? 'P3';
    const sla = this.calculateSlaDeadlines(priority);
    const productId = data.productId ?? null;
    const category = (data.category as TicketCategoryEnum | undefined) ?? 'UNCLASSIFIED';

    await assertSupportTechnicalLinksValid(this.prisma, {
      projectId: data.projectId,
      productId,
      technicalAssetId: data.technicalAssetId,
      technicalEnvironmentId: data.technicalEnvironmentId,
    });

    const ticket = await this.prisma.supportTicket.create({
      data: {
        code,
        title: data.title,
        projectId: data.projectId,
        productId: data.productId,
        category,
        coverageDecision: data.coverageDecision as SupportCoverageEnum | undefined,
        description: data.description,
        contactId: data.contactId,
        priority,
        billable: data.billable ?? false,
        assignedTo: data.assignedTo,
        slaResponseDeadline: sla.responseDeadline,
        slaResolveDeadline: sla.resolveDeadline,
        technicalAssetId: data.technicalAssetId ?? null,
        technicalEnvironmentId: data.technicalEnvironmentId ?? null,
      },
      include: SUPPORT_TICKET_INCLUDE,
    });
    return this.attachSla(ticket);
  }

  async update(id: string, data: UpdateTicketDto) {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Support ticket ${id} not found`);

    const nextProjectId = data.projectId ?? existing.projectId;
    const nextProductId = data.productId !== undefined ? data.productId : existing.productId;
    let nextTechnicalAssetId =
      data.technicalAssetId !== undefined
        ? data.technicalAssetId
        : (existing.technicalAssetId ?? null);
    let nextTechnicalEnvironmentId =
      data.technicalEnvironmentId !== undefined
        ? data.technicalEnvironmentId
        : (existing.technicalEnvironmentId ?? null);

    if (data.projectId !== undefined && data.projectId !== existing.projectId) {
      if (data.technicalAssetId === undefined && data.technicalEnvironmentId === undefined) {
        nextTechnicalAssetId = null;
        nextTechnicalEnvironmentId = null;
      }
    }

    if (data.productId !== undefined && data.productId !== existing.productId) {
      if (data.technicalAssetId === undefined && data.technicalEnvironmentId === undefined) {
        nextTechnicalAssetId = null;
        nextTechnicalEnvironmentId = null;
      }
    }

    if (data.productId !== undefined && data.productId === null) {
      nextTechnicalAssetId = null;
      nextTechnicalEnvironmentId = null;
    }

    await assertSupportTechnicalLinksValid(this.prisma, {
      projectId: nextProjectId,
      productId: nextProductId,
      technicalAssetId: nextTechnicalAssetId,
      technicalEnvironmentId: nextTechnicalEnvironmentId,
    });

    if (data.resolutionSummary !== undefined) {
      if (existing.status === 'CLOSED') {
        throw new BadRequestException('Resolution fields cannot be edited on a closed ticket.');
      }
    }

    const updateData: Prisma.SupportTicketUpdateInput = {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.resolutionSummary !== undefined && {
        resolutionSummary: data.resolutionSummary?.trim() || null,
      }),
      ...(data.projectId && { project: { connect: { id: data.projectId } } }),
      ...(data.productId !== undefined && {
        product: data.productId ? { connect: { id: data.productId } } : { disconnect: true },
      }),
      ...(data.contactId !== undefined && {
        contact: data.contactId ? { connect: { id: data.contactId } } : { disconnect: true },
      }),
      ...(data.category && { category: data.category as TicketCategoryEnum }),
      ...(data.coverageDecision !== undefined && {
        coverageDecision: data.coverageDecision
          ? (data.coverageDecision as SupportCoverageEnum)
          : null,
      }),
      ...(data.billable !== undefined && { billable: data.billable }),
      ...(data.assignedTo !== undefined && {
        assignee: data.assignedTo ? { connect: { id: data.assignedTo } } : { disconnect: true },
      }),
    };

    if (data.priority) {
      const sla = this.calculateSlaDeadlines(data.priority as TicketPriorityEnum);
      const pauseReset = resetPauseForSlaRecalculation(existing.waitingState, new Date());
      updateData.priority = data.priority as TicketPriorityEnum;
      updateData.slaResponseDeadline = sla.responseDeadline;
      updateData.slaResolveDeadline = sla.resolveDeadline;
      updateData.slaPausedTotalSeconds = pauseReset.slaPausedTotalSeconds;
      updateData.slaPauseStartedAt = pauseReset.slaPauseStartedAt;
    }

    const technicalTouched =
      data.technicalAssetId !== undefined ||
      data.technicalEnvironmentId !== undefined ||
      data.productId !== undefined ||
      data.projectId !== undefined;

    if (technicalTouched) {
      updateData.technicalAsset = nextTechnicalAssetId
        ? { connect: { id: nextTechnicalAssetId } }
        : { disconnect: true };
      updateData.technicalEnvironment = nextTechnicalEnvironmentId
        ? { connect: { id: nextTechnicalEnvironmentId } }
        : { disconnect: true };
    }

    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: SUPPORT_TICKET_INCLUDE,
    });
    return this.attachSla(ticket);
  }

  async createExecutionTask(id: string, data: CreateTicketTaskDto) {
    const ticket = await this.findTicketForTaskBridge(id);
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Resolved or closed support tickets cannot create tasks.');
    }

    const workspaceId = await this.findProductWorkspaceId(ticket.productId);
    return this.prisma.task.create({
      data: {
        code: await this.generateTaskCode(),
        title: this.buildExecutionTaskTitle(ticket, data.title),
        creatorId: data.creatorId,
        description: data.description ?? this.buildExecutionTaskDescription(ticket),
        assigneeId: ticket.assignedTo,
        priority: TICKET_PRIORITY_TO_TASK_PRIORITY[ticket.priority],
        dueDate: data.dueDate ? new Date(data.dueDate) : ticket.slaResolveDeadline,
        workspaceId,
        ...(workspaceId && { planningStatus: 'BACKLOG' }),
        links: { createMany: { data: this.buildTaskLinks(ticket) } },
      },
      include: SUPPORT_TASK_INCLUDE,
    });
  }

  async createExtensionDeal(id: string, data: CreateExtensionDealDto) {
    const ticket = await this.findTicketForChangeControl(id);
    if (ticket.extensionDealId) {
      return this.findExtensionDealOrThrow(ticket.extensionDealId);
    }

    const contactId = data.contactId ?? ticket.contactId;
    if (!contactId) {
      throw new BadRequestException('Contact is required to create an Extension Deal.');
    }

    const deal = await this.prisma.deal.create({
      data: {
        code: await this.generateDealCode(),
        name: this.buildExtensionDealName(ticket, data.name),
        contactId,
        projectId: ticket.projectId,
        type: 'EXTENSION',
        amount: data.amount,
        paymentType: (data.paymentType as PaymentTypeEnum) ?? 'CLASSIC',
        taxStatus: 'TAX',
        sellerId: data.sellerId,
        source: 'CLIENT',
        sourceDetail: `Support ticket ${ticket.code}`,
        notes: this.buildExtensionDealNotes(ticket, data.notes),
        existingProductId: ticket.productId,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        extensionDealId: deal.id,
        status: ticket.status === 'NEW' ? 'TRIAGED' : ticket.status,
      },
    });

    return deal;
  }

  async updateStatus(
    id: string,
    status: string,
    actorId: string,
    options?: { resolutionSummary?: string; closeReason?: string },
  ) {
    if (status === 'REOPENED') {
      throw new BadRequestException(
        'REOPENED is not a persistent status. Use reopen action endpoint instead.',
      );
    }
    const beforeRow = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!beforeRow) throw new NotFoundException(`Support ticket ${id} not found`);

    const nextStatus = status as TicketStatusEnum;
    if (nextStatus === 'IN_PROGRESS' && ['RESOLVED', 'CLOSED'].includes(beforeRow.status)) {
      throw new BadRequestException(
        'Use the reopen action to return a ticket to In Progress from Resolved or Closed.',
      );
    }

    if (nextStatus === 'RESOLVED') {
      const summary = options?.resolutionSummary?.trim() ?? '';
      if (summary.length < MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH) {
        throw new BadRequestException(
          `resolutionSummary is required (at least ${MIN_SUPPORT_RESOLUTION_SUMMARY_LENGTH} characters) when moving to Resolved.`,
        );
      }
    }

    if (nextStatus === 'CLOSED' && beforeRow.status !== 'RESOLVED') {
      throw new BadRequestException(
        'Tickets can only be closed manually from Resolved. Extension delivery uses system close.',
      );
    }

    let terminalClear: Prisma.SupportTicketUpdateInput = {};
    if (['RESOLVED', 'CLOSED'].includes(status)) {
      const pause = buildPauseFieldsAfterWaitingChange(
        {
          waitingState: beforeRow.waitingState,
          slaPausedTotalSeconds: beforeRow.slaPausedTotalSeconds,
          slaPauseStartedAt: beforeRow.slaPauseStartedAt,
        },
        'NONE',
        new Date(),
      );
      terminalClear = {
        waitingState: 'NONE',
        waitingReason: null,
        ...pause,
      };
    }

    const data: Prisma.SupportTicketUpdateInput = {
      status: nextStatus,
      ...terminalClear,
    };

    if (nextStatus === 'RESOLVED') {
      data.resolutionSummary = options!.resolutionSummary!.trim();
      data.closeReason = null;
    }
    if (nextStatus === 'CLOSED') {
      data.closeReason =
        parseSupportTicketCloseReason(options?.closeReason) ?? ('CLIENT_CONFIRMED' as const);
    }

    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data,
      include: SUPPORT_TICKET_INCLUDE,
    });
    await this.logStatusEvent(id, beforeRow.projectId, actorId, 'support.status_changed', {
      from: beforeRow.status,
      to: ticket.status,
      resolutionSummary: nextStatus === 'RESOLVED' ? ticket.resolutionSummary : undefined,
      closeReason: nextStatus === 'CLOSED' ? ticket.closeReason : undefined,
    });
    return this.attachSla(ticket);
  }

  /**
   * When an extension reaches Done, close any change-control ticket linked to the same deal/order.
   */
  async closeLinkedTicketsAfterExtensionDelivered(
    extensionId: string,
    actorId: string,
  ): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { extensionId },
      select: { id: true, dealId: true },
    });
    if (!order?.dealId) return;

    const tickets = await this.prisma.supportTicket.findMany({
      where: { extensionDealId: order.dealId, status: { not: 'CLOSED' } },
      select: {
        id: true,
        projectId: true,
        status: true,
        resolutionSummary: true,
        waitingState: true,
        slaPausedTotalSeconds: true,
        slaPauseStartedAt: true,
      },
    });

    for (const row of tickets) {
      const pause = buildPauseFieldsAfterWaitingChange(
        {
          waitingState: row.waitingState,
          slaPausedTotalSeconds: row.slaPausedTotalSeconds,
          slaPauseStartedAt: row.slaPauseStartedAt,
        },
        'NONE',
        new Date(),
      );
      await this.prisma.supportTicket.update({
        where: { id: row.id },
        data: {
          status: 'CLOSED',
          resolutionSummary:
            row.resolutionSummary?.trim() || SUPPORT_EXTENSION_DELIVERED_RESOLUTION_SUMMARY,
          closeReason: 'EXTENSION_DELIVERED',
          waitingState: 'NONE',
          waitingReason: null,
          ...pause,
        },
      });
      await this.logStatusEvent(
        row.id,
        row.projectId,
        actorId,
        'support.closed_extension_delivered',
        {
          from: row.status,
          to: 'CLOSED',
          orderId: order.id,
          extensionId,
          closeReason: 'EXTENSION_DELIVERED',
        },
      );
    }
  }

  async reopen(id: string, actorId: string, reason?: string) {
    const beforeRow = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!beforeRow) throw new NotFoundException(`Support ticket ${id} not found`);
    if (!['RESOLVED', 'CLOSED'].includes(beforeRow.status)) {
      throw new BadRequestException('Only resolved or closed tickets can be reopened.');
    }
    const pause = buildPauseFieldsAfterWaitingChange(
      {
        waitingState: beforeRow.waitingState,
        slaPausedTotalSeconds: beforeRow.slaPausedTotalSeconds,
        slaPauseStartedAt: beforeRow.slaPauseStartedAt,
      },
      'NONE',
      new Date(),
    );
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        resolutionSummary: null,
        closeReason: null,
        waitingState: 'NONE',
        waitingReason: null,
        ...pause,
      },
      include: SUPPORT_TICKET_INCLUDE,
    });
    await this.logStatusEvent(id, beforeRow.projectId, actorId, 'support.reopened', {
      from: beforeRow.status,
      to: 'IN_PROGRESS',
      reason: reason?.trim() || null,
    });
    return this.attachSla(ticket);
  }

  async updateWaitingState(
    id: string,
    body: { waitingState: string; waitingReason?: string | null },
    actorId: string,
  ) {
    const row = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!row) throw new NotFoundException(`Support ticket ${id} not found`);
    if (['RESOLVED', 'CLOSED'].includes(row.status)) {
      throw new BadRequestException('Waiting overlay cannot be set on resolved or closed tickets.');
    }
    const next = assertTicketWaitingState(body.waitingState);
    const pause = buildPauseFieldsAfterWaitingChange(
      {
        waitingState: row.waitingState,
        slaPausedTotalSeconds: row.slaPausedTotalSeconds,
        slaPauseStartedAt: row.slaPauseStartedAt,
      },
      next,
      new Date(),
    );
    const reasonTrim = body.waitingReason?.trim() ?? null;
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        waitingState: next,
        waitingReason: reasonTrim || null,
        slaPausedTotalSeconds: pause.slaPausedTotalSeconds,
        slaPauseStartedAt: pause.slaPauseStartedAt,
      },
      include: SUPPORT_TICKET_INCLUDE,
    });
    await this.logStatusEvent(id, row.projectId, actorId, 'support.waiting_changed', {
      from: row.waitingState,
      to: next,
      reason: ticket.waitingReason,
    });
    return this.attachSla(ticket);
  }

  async recordManagerialEscalation(id: string, actorId: string, reason?: string) {
    const row = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!row) throw new NotFoundException(`Support ticket ${id} not found`);
    if (['RESOLVED', 'CLOSED'].includes(row.status)) {
      throw new BadRequestException('Escalation is not available for resolved or closed tickets.');
    }
    const pause = buildPauseFieldsAfterWaitingChange(
      {
        waitingState: row.waitingState,
        slaPausedTotalSeconds: row.slaPausedTotalSeconds,
        slaPauseStartedAt: row.slaPauseStartedAt,
      },
      'ESCALATED',
      new Date(),
    );
    const mergedReason = reason?.trim() || row.waitingReason;
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        waitingState: 'ESCALATED',
        waitingReason: mergedReason || null,
        slaPausedTotalSeconds: pause.slaPausedTotalSeconds,
        slaPauseStartedAt: pause.slaPauseStartedAt,
      },
      include: SUPPORT_TICKET_INCLUDE,
    });
    await this.logStatusEvent(id, row.projectId, actorId, 'support.escalation_manager', {
      reason: mergedReason || null,
      escalatedBy: actorId,
    });

    await this.sendManagerialEscalationNotifications(ticket, mergedReason ?? null);

    return this.attachSla(ticket);
  }

  private async sendManagerialEscalationNotifications(
    ticket: {
      id: string;
      code: string;
      title: string;
      assignedTo: string | null;
      project: { name: string };
    },
    mergedReason: string | null,
  ): Promise<void> {
    const recipients = await resolveSupportSlaNotificationRecipientIds(
      this.prisma,
      ticket.assignedTo,
    );
    const headline = mergedReason?.length
      ? `Managerial escalation: ${mergedReason}`
      : 'Managerial escalation';
    const burst = randomUUID();
    for (const recipientId of recipients) {
      await this.notificationService.create({
        type: MANAGER_ESCALATION_NOTIFICATION,
        recipientId,
        title: 'Support escalation',
        body: `${ticket.code} · ${headline}`,
        link: '/support',
        entityType: 'SupportTicket',
        entityId: ticket.id,
        sourceModule: 'support',
        dedupeKey: `support-escalation-manual:${ticket.id}:${burst}:${recipientId}`,
        idempotencyKey: `support-escalation-manual:${ticket.id}:${burst}:${recipientId}`,
        payload: {
          ticketCode: ticket.code,
          ticketTitle: ticket.title,
          projectName: ticket.project.name,
          reason: mergedReason,
        },
      });
    }
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.supportTicket.delete({ where: { id } });
  }

  async getStats() {
    const [byStatus, byPriority, byCategory, byCoverage] = await Promise.all([
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['priority'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['category'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['coverageDecision'], _count: true }),
    ]);
    return { byStatus, byPriority, byCategory, byCoverage };
  }

  private calculateSlaDeadlines(priority: string) {
    const sla = SLA_DEADLINES[priority] ?? SLA_DEADLINES['P3'];
    const now = new Date();
    return {
      responseDeadline: new Date(now.getTime() + sla.responseHours * 3600_000),
      resolveDeadline: new Date(now.getTime() + sla.resolveHours * 3600_000),
    };
  }

  private buildWhere(
    filters: Omit<TicketQueryParams, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
  ): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status as TicketStatusEnum;
    if (filters.priority) where.priority = filters.priority as TicketPriorityEnum;
    if (filters.category) where.category = filters.category as TicketCategoryEnum;
    if (filters.coverageDecision) {
      where.coverageDecision = filters.coverageDecision as SupportCoverageEnum;
    }
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.waitingState) {
      where.waitingState = filters.waitingState as TicketWaitingStateEnum;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private attachSla<
    T extends {
      status: string;
      createdAt: Date;
      waitingState: TicketWaitingStateEnum;
      slaResponseDeadline: Date | null;
      slaResolveDeadline: Date | null;
      slaPausedTotalSeconds: number;
      slaPauseStartedAt: Date | null;
    },
  >(ticket: T) {
    return { ...ticket, slaState: buildSupportSlaProjection(ticket) };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.supportTicket.findFirst({
      where: { code: { startsWith: `TKT-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `TKT-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async generateTaskCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.task.findFirst({
      where: { code: { startsWith: `T-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `T-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async findExecutionTasks(ticketId: string) {
    return this.prisma.task.findMany({
      where: { links: { some: { entityType: SUPPORT_TICKET_ENTITY_TYPE, entityId: ticketId } } },
      include: SUPPORT_TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findTicketForTaskBridge(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    return ticket;
  }

  private async findTicketForChangeControl(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    if (ticket.category !== 'CHANGE_REQUEST') {
      throw new BadRequestException('Only CHANGE_REQUEST tickets can create Extension Deals.');
    }
    if (!ticket.productId) {
      throw new BadRequestException('Product context is required to create an Extension Deal.');
    }
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Resolved or closed support tickets cannot create deals.');
    }
    return ticket;
  }

  private async findExtensionDealOrThrow(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });
    if (!deal) throw new NotFoundException(`Extension Deal ${dealId} not found`);
    return deal;
  }

  private async findProductWorkspaceId(productId: string | null) {
    if (!productId) return undefined;
    const workspace = await this.prisma.workSpace.findUnique({
      where: { productId },
      select: { id: true },
    });
    return workspace?.id;
  }

  private buildTaskLinks(ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>) {
    return [
      { entityType: SUPPORT_TICKET_ENTITY_TYPE, entityId: ticket.id },
      { entityType: PROJECT_ENTITY_TYPE, entityId: ticket.projectId },
      ...(ticket.productId
        ? [{ entityType: PRODUCT_ENTITY_TYPE, entityId: ticket.productId }]
        : []),
    ];
  }

  private buildExecutionTaskTitle(
    ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>,
    title?: string,
  ) {
    const trimmed = title?.trim();
    return trimmed || `[${ticket.code}] ${ticket.title}`;
  }

  private buildExecutionTaskDescription(
    ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>,
  ) {
    return `Support ticket: ${ticket.code}\n${ticket.description ?? ''}`.trim();
  }

  private async generateDealCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.deal.findFirst({
      where: { code: { startsWith: `D-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `D-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private buildExtensionDealName(
    ticket: Awaited<ReturnType<SupportService['findTicketForChangeControl']>>,
    name?: string,
  ) {
    const trimmed = name?.trim();
    return trimmed || `[${ticket.code}] ${ticket.title}`;
  }

  private buildExtensionDealNotes(
    ticket: Awaited<ReturnType<SupportService['findTicketForChangeControl']>>,
    notes?: string,
  ) {
    return [notes?.trim(), `Support ticket: ${ticket.code}`, ticket.description]
      .filter(Boolean)
      .join('\n\n');
  }

  private async logStatusEvent(
    ticketId: string,
    projectId: string,
    actorId: string,
    action: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.auditService.log({
      entityType: 'SupportTicket',
      entityId: ticketId,
      action,
      userId: actorId,
      projectId,
      changes,
    });
  }
}
