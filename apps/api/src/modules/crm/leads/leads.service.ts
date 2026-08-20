import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { permanentlyDeleteProfileATrashedEntity } from '../../../common/lifecycle/profile-a-permanent-delete.ops';
import { assertAttributionUpdateAllowed, type AttributionForValidation } from '../attribution-gate';
import { assertPartnerAssignableForInboundCrm } from '../../partners/partner-crm-source.ops';
import { validateLeadStageGate } from './lead-stage-gate';
import { resolveLeadCreateDefaults } from './lead-create-defaults.op';
import { employeePersonSelect } from '../../../common/employee-person.select';
import { leadDetailInclude } from './lead.includes';
import {
  mapMetaConversationForLead,
  metaConversationLeadInclude,
} from '../../integrations/meta/meta-conversation.dto';
import { syncEntityContactLinks } from '../shared/sync-entity-contact-links.ops';
import { resolveSortField, normalizeSortDirection } from '../../../common/utils/sort-order';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../../common/lifecycle/entity-lifecycle-guards';
import {
  mergeProfileAListScope,
  parseLifecycleScopeFromQuery,
} from '../../../common/lifecycle/entity-lifecycle-scope';
import {
  findLeadDuplicateCandidates,
  type LeadDuplicateLookupQuery,
} from './lead-duplicate-lookup.ops';
import { mergeLeads } from './lead-merge.ops';
import { attachLeadToContact } from './lead-attach-contact.ops';
import { pourLeadIntoContact } from './lead-pour-into-contact.ops';
import { createContactFromLead } from './lead-create-contact.ops';
import type { LeadCreateContactAttachType } from './dto/create-lead-contact.dto';
import { LEAD_MERGE_ERROR } from './lead-identity.ops';
import { buildLeadSearchOr } from './lead-search.where';
import type { LeadMergeFieldChoices } from '@nbos/shared';

const LEAD_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'name', 'status', 'source']);

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
  contactId?: string;
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
  contactIds?: string[];
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
  scope?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

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
      scope,
    } = params;

    const lifecycleScope = parseLifecycleScopeFromQuery(scope);
    const where: Prisma.LeadWhereInput = mergeProfileAListScope({}, lifecycleScope);
    if (lifecycleScope === 'active') {
      where.mergedIntoId = null;
    }

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
      where.OR = buildLeadSearchOr(search);
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignee: { select: employeePersonSelect },
          sourcePartner: { select: { id: true, name: true } },
          sourceContact: { select: { id: true, firstName: true, lastName: true } },
          marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
          marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
          deal: { select: { id: true, code: true, status: true } },
          ...metaConversationLeadInclude,
        },
        orderBy: {
          [resolveSortField(sortBy, LEAD_SORT_FIELDS, 'createdAt')]:
            normalizeSortDirection(sortOrder),
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map((lead) => this.mapLeadResponse(lead)),
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
      include: leadDetailInclude,
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return this.mapLeadResponse(lead);
  }

  private mapLeadResponse<T extends Record<string, unknown>>(lead: T) {
    const { metaConversation, ...rest } = lead as T & {
      metaConversation?: Parameters<typeof mapMetaConversationForLead>[0];
    };
    return {
      ...rest,
      metaConversation: mapMetaConversationForLead(metaConversation),
    };
  }

  async create(
    data: CreateLeadDto,
    meta: { actorId?: string; canOverridePausedPartner?: boolean } = {},
  ) {
    const resolved = resolveLeadCreateDefaults(data, meta);
    if (resolved.source === 'PARTNER' || resolved.sourcePartnerId) {
      await assertPartnerAssignableForInboundCrm(
        this.prisma,
        resolved.source ?? null,
        resolved.sourcePartnerId,
        meta.canOverridePausedPartner === true,
      );
    }
    if (resolved.contactId) {
      const contact = await this.prisma.contact.findUnique({
        where: { id: resolved.contactId },
        select: { id: true, trashedAt: true },
      });
      if (!contact || contact.trashedAt) {
        throw new NotFoundException(`Contact ${resolved.contactId} not found`);
      }
    }
    const code = await this.generateCode();
    const createData: Prisma.LeadUncheckedCreateInput = {
      code,
      name: resolved.name,
      contactName: resolved.contactName ?? '',
      phone: resolved.phone,
      email: resolved.email,
      source: resolved.source
        ? (resolved.source as Prisma.LeadUncheckedCreateInput['source'])
        : undefined,
      sourceDetail: resolved.sourceDetail,
      sourcePartnerId: resolved.sourcePartnerId,
      sourceContactId: resolved.sourceContactId,
      marketingAccountId: resolved.marketingAccountId,
      marketingActivityId: resolved.marketingActivityId,
      assignedTo: resolved.assignedTo,
      notes: resolved.notes,
      ...(resolved.contactId ? { contactId: resolved.contactId } : {}),
    };

    return this.prisma.lead.create({
      data: createData,
      include: {
        assignee: { select: employeePersonSelect },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
        deal: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async update(id: string, data: UpdateLeadDto, meta: { canOverridePausedPartner?: boolean } = {}) {
    const existing = await this.findById(id);
    assertEntityIsActive(existing, 'trashedAt', 'Lead');
    const nextSource = data.source !== undefined ? data.source : existing.source;
    const nextPartnerId =
      data.sourcePartnerId !== undefined ? data.sourcePartnerId : existing.sourcePartnerId;
    if (data.source !== undefined || data.sourcePartnerId !== undefined) {
      await assertPartnerAssignableForInboundCrm(
        this.prisma,
        nextSource,
        nextPartnerId,
        meta.canOverridePausedPartner === true,
      );
    }
    const nextStatus = data.status ?? existing.status;
    if (data.status && data.status !== existing.status) {
      this.assertStatusTransitionAllowed(existing.status, data.status);
      validateLeadStageGate(mergeLeadForStageGate(existing, data), data.status);
    }
    const attributionLocked = this.requiresAttribution(nextStatus);
    const attributionPatch = buildLeadAttributionPatch(data);
    assertAttributionUpdateAllowed({
      context: 'Lead',
      before: pickLeadAttribution(existing),
      patch: attributionPatch,
      locked: attributionLocked,
    });

    let resolvedContactId = existing.contactId;

    if (data.contactIds !== undefined) {
      const { primaryContactId } = await syncEntityContactLinks(
        this.prisma,
        'lead',
        id,
        data.contactIds,
      );
      resolvedContactId = primaryContactId;
    }

    const lead = await this.prisma.lead.update({
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
        ...(data.contactIds !== undefined && { contactId: resolvedContactId }),
      },
      include: leadDetailInclude,
    });

    if (data.contactIds !== undefined) {
      return this.findById(id);
    }

    return lead;
  }

  async moveToTrash(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    assertEntityIsActive(lead, 'trashedAt', 'Lead');
    return this.prisma.lead.update({
      where: { id },
      data: { trashedAt: new Date() },
    });
  }

  async restoreFromTrash(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      select: { id: true, trashedAt: true, mergedIntoId: true },
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    assertEntityIsTrashed(lead, 'trashedAt', 'Lead');
    if (lead.mergedIntoId) {
      throw new BadRequestException({
        statusCode: 400,
        code: LEAD_MERGE_ERROR.RESTORE,
        message: 'This Lead was merged into another card. Restore without un-merge is not allowed.',
      });
    }
    return this.prisma.lead.update({
      where: { id },
      data: { trashedAt: null },
    });
  }

  async findDuplicates(query: LeadDuplicateLookupQuery) {
    return findLeadDuplicateCandidates(this.prisma, query);
  }

  async mergeLeads(
    survivorId: string,
    body: { absorbedId: string; fieldChoices?: LeadMergeFieldChoices; status?: string },
    actor: { id: string; roleSlug: string; isPlatformOwner?: boolean },
  ) {
    await mergeLeads(this.prisma, this.auditService, {
      survivorId,
      absorbedId: body.absorbedId,
      fieldChoices: body.fieldChoices ?? {},
      status: body.status,
      actorId: actor.id,
      actorRoleSlug: actor.roleSlug,
      isPlatformOwner: actor.isPlatformOwner === true,
    });
    return this.findById(survivorId);
  }

  async attachContact(
    leadId: string,
    body: { contactId: string; aboutDealId?: string },
    actor: { id: string; roleSlug: string; isPlatformOwner?: boolean },
  ) {
    await attachLeadToContact(this.prisma, this.auditService, {
      leadId,
      contactId: body.contactId,
      aboutDealId: body.aboutDealId,
      actorId: actor.id,
      actorRoleSlug: actor.roleSlug,
      isPlatformOwner: actor.isPlatformOwner === true,
    });
    return this.findById(leadId);
  }

  async pourIntoContact(
    leadId: string,
    contactId: string,
    actor: { id: string; roleSlug: string; isPlatformOwner?: boolean },
  ) {
    await pourLeadIntoContact(this.prisma, this.auditService, {
      leadId,
      contactId,
      actorId: actor.id,
      actorRoleSlug: actor.roleSlug,
      isPlatformOwner: actor.isPlatformOwner === true,
    });
    return this.findById(leadId);
  }

  async createContactFromLead(
    leadId: string,
    body: { attach?: { type: LeadCreateContactAttachType; id: string } },
    actor: { id: string; roleSlug: string; isPlatformOwner?: boolean },
  ) {
    await createContactFromLead(this.prisma, this.auditService, {
      leadId,
      attach: body.attach,
      actorId: actor.id,
      actorRoleSlug: actor.roleSlug,
      isPlatformOwner: actor.isPlatformOwner === true,
    });
    return this.findById(leadId);
  }

  async permanentlyDeleteFromTrash(id: string, userId: string) {
    await permanentlyDeleteProfileATrashedEntity(this.prisma, this.auditService, {
      key: 'lead',
      id,
      userId,
    });
  }

  async updateStatus(id: string, status: string) {
    const lead = await this.findById(id);
    this.assertStatusTransitionAllowed(lead.status, status);
    validateLeadStageGate(lead, status);
    return this.update(id, { status });
  }

  async getStats() {
    const activeWhere = mergeProfileAListScope({ mergedIntoId: null }, 'active');
    const [total, byStatus, bySource] = await Promise.all([
      this.prisma.lead.count({ where: activeWhere }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: activeWhere,
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: activeWhere,
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

function mergeLeadForStageGate(
  existing: {
    contactName: string;
    phone: string | null;
    email: string | null;
    assignedTo: string | null;
    notes: string | null;
    source: string | null;
    sourceDetail: string | null;
    sourcePartnerId: string | null;
    sourceContactId: string | null;
    marketingAccountId: string | null;
    marketingActivityId: string | null;
  },
  data: UpdateLeadDto,
) {
  return {
    contactName: data.contactName ?? existing.contactName,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    email: data.email !== undefined ? data.email : existing.email,
    assignedTo: data.assignedTo !== undefined ? data.assignedTo : existing.assignedTo,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    source: data.source !== undefined ? data.source : existing.source,
    sourceDetail: data.sourceDetail !== undefined ? data.sourceDetail : existing.sourceDetail,
    sourcePartnerId:
      data.sourcePartnerId !== undefined ? data.sourcePartnerId : existing.sourcePartnerId,
    sourceContactId:
      data.sourceContactId !== undefined ? data.sourceContactId : existing.sourceContactId,
    marketingAccountId:
      data.marketingAccountId !== undefined ? data.marketingAccountId : existing.marketingAccountId,
    marketingActivityId:
      data.marketingActivityId !== undefined
        ? data.marketingActivityId
        : existing.marketingActivityId,
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
