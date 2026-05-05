import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  assertAttributionUpdateAllowed,
  type AttributionForValidation,
  validateAttributionGate,
} from '../attribution-gate';

const ACTIVE_LEAD_STATUSES = new Set([
  'NEW',
  'ON_HOLD',
  'DIDNT_GET_THROUGH',
  'CONTACT_ESTABLISHED',
  'MQL',
]);
const CLOSED_LEAD_STATUSES = new Set(['SPAM', 'SQL']);

interface CreateLeadDto {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string | null;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  assignedTo?: string;
  notes?: string;
}

interface UpdateLeadDto {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string | null;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  status?: string;
  assignedTo?: string;
  notes?: string;
}

interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class LeadsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: LeadQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      source,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumLeadStatusEnumFilter['equals'];
    }
    if (source) {
      where.source = source as Prisma.EnumLeadSourceEnumNullableFilter['equals'];
    }
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          sourcePartner: { select: { id: true, name: true } },
          sourceContact: { select: { id: true, firstName: true, lastName: true } },
          marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
          marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
          deal: { select: { id: true, code: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
        contact: true,
        deal: true,
      },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return lead;
  }

  async create(data: CreateLeadDto) {
    const code = await this.generateCode();
    const createData: Prisma.LeadUncheckedCreateInput = {
      code,
      name: data.name,
      contactName: data.contactName ?? '',
      phone: data.phone,
      email: data.email,
      source: data.source ? (data.source as Prisma.LeadUncheckedCreateInput['source']) : undefined,
      sourceDetail: data.sourceDetail,
      sourcePartnerId: data.sourcePartnerId,
      sourceContactId: data.sourceContactId,
      marketingAccountId: data.marketingAccountId,
      marketingActivityId: data.marketingActivityId,
      assignedTo: data.assignedTo,
      notes: data.notes,
    };

    return this.prisma.lead.create({
      data: createData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
        deal: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async update(id: string, data: UpdateLeadDto) {
    const existing = await this.findById(id);
    const nextStatus = data.status ?? existing.status;
    const attributionLocked = this.requiresAttribution(nextStatus);
    const attributionPatch = buildLeadAttributionPatch(data);
    assertAttributionUpdateAllowed({
      context: 'Lead',
      before: pickLeadAttribution(existing),
      patch: attributionPatch,
      locked: attributionLocked,
    });

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contactName && { contactName: data.contactName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.source !== undefined && {
          source: data.source ? (data.source as Prisma.LeadUpdateInput['source']) : null,
        }),
        ...(data.sourceDetail !== undefined && { sourceDetail: data.sourceDetail }),
        ...(data.sourcePartnerId !== undefined && { sourcePartnerId: data.sourcePartnerId }),
        ...(data.sourceContactId !== undefined && { sourceContactId: data.sourceContactId }),
        ...(data.marketingAccountId !== undefined && {
          marketingAccountId: data.marketingAccountId,
        }),
        ...(data.marketingActivityId !== undefined && {
          marketingActivityId: data.marketingActivityId,
        }),
        ...(data.status && { status: data.status as Prisma.LeadUpdateInput['status'] }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
        deal: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    const lead = await this.findById(id);
    this.assertStatusTransitionAllowed(lead.status, status);
    if (this.requiresAttribution(status)) {
      validateAttributionGate(lead, 'Lead', status);
    }
    return this.update(id, { status });
  }

  async getStats() {
    const [total, byStatus, bySource] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        _count: true,
      }),
    ]);

    return { total, byStatus, bySource };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await this.prisma.lead.findFirst({
      where: { code: { startsWith: `L-${year}-` } },
      orderBy: { code: 'desc' },
    });

    const nextNum = lastLead ? parseInt(lastLead.code.split('-')[2] ?? '0', 10) + 1 : 1;

    return `L-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private requiresAttribution(status: string): boolean {
    return !['NEW', 'ON_HOLD', 'SPAM'].includes(status);
  }

  private assertStatusTransitionAllowed(currentStatus: string, targetStatus: string): void {
    if (currentStatus === targetStatus) return;

    if (currentStatus === 'SQL') {
      throw new BadRequestException({
        statusCode: 400,
        code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        message: 'Lead Won is a closed outcome and cannot be moved back.',
        errors: [{ field: 'status', message: 'Create a new Lead if this was closed by mistake.' }],
      });
    }

    if (currentStatus === 'SPAM' && !ACTIVE_LEAD_STATUSES.has(targetStatus)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        message: 'Spam leads can only be restored to an active Lead stage.',
        errors: [{ field: 'status', message: 'Restore to New or another active stage first.' }],
      });
    }

    if (!ACTIVE_LEAD_STATUSES.has(targetStatus) && !CLOSED_LEAD_STATUSES.has(targetStatus)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        message: `Unsupported Lead status: ${targetStatus}`,
        errors: [{ field: 'status', message: 'Choose a valid Lead stage.' }],
      });
    }
  }
}

function pickLeadAttribution(lead: {
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
}): AttributionForValidation {
  return {
    source: lead.source,
    sourceDetail: lead.sourceDetail,
    sourcePartnerId: lead.sourcePartnerId,
    sourceContactId: lead.sourceContactId,
    marketingAccountId: lead.marketingAccountId,
    marketingActivityId: lead.marketingActivityId,
  };
}

function buildLeadAttributionPatch(data: UpdateLeadDto): Partial<AttributionForValidation> {
  const patch: Partial<AttributionForValidation> = {};
  if (data.source !== undefined) patch.source = data.source;
  if (data.sourceDetail !== undefined) patch.sourceDetail = data.sourceDetail;
  if (data.sourcePartnerId !== undefined) patch.sourcePartnerId = data.sourcePartnerId;
  if (data.sourceContactId !== undefined) patch.sourceContactId = data.sourceContactId;
  if (data.marketingAccountId !== undefined) patch.marketingAccountId = data.marketingAccountId;
  if (data.marketingActivityId !== undefined) {
    patch.marketingActivityId = data.marketingActivityId;
  }
  return patch;
}
