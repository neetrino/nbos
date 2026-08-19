import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ContactRole,
  type InputJsonValue,
  type TransactionClient,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { permanentlyDeleteProfileATrashedEntity } from '../../../common/lifecycle/profile-a-permanent-delete.ops';
import { resolveSortField, normalizeSortDirection } from '../../../common/utils/sort-order';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../../common/lifecycle/entity-lifecycle-guards';
import { parseLifecycleScopeFromQuery } from '../../../common/lifecycle/entity-lifecycle-scope';
import type { ContactMergeFieldChoices } from '@nbos/shared';
import { mergeClientListScope } from '../client-entity-lifecycle';
import {
  CONTACT_LIST_INCLUDE,
  CONTACT_PHONE_ERROR,
  CONTACT_EXTRA_PHONE_SELECT,
  assertStoredContactPhone,
  contactDirectorySearchOr,
  contactOwnsPhone,
  createExtraContactPhone,
  deleteOverlappingExtraPhones,
} from './contact-phone.ops';
import { findContactMergeCandidates, mergeContacts as runContactMerge } from './contact-merge.ops';
import { CONTACT_MERGE_ERROR } from './contact-merge-guards.ops';

const CONTACT_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']);

async function applyContactUpdate(
  tx: TransactionClient,
  id: string,
  data: Partial<CreateContactDto>,
) {
  if (data.phone !== undefined) {
    await deleteOverlappingExtraPhones(tx, id, data.phone);
  }
  return tx.contact.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role && { role: data.role as ContactRole }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.messengerLinks !== undefined && {
        messengerLinks: JSON.parse(JSON.stringify(data.messengerLinks)),
      }),
    },
    include: CONTACT_LIST_INCLUDE,
  });
}

interface CreateContactDto {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
  messengerLinks?: InputJsonValue;
}

interface ContactQueryParams {
  page?: number;
  pageSize?: number;
  contactType?: string;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  scope?: string;
}

@Injectable()
export class ContactsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: ContactQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      contactType,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      scope,
    } = params;

    const lifecycleScope = parseLifecycleScopeFromQuery(scope);
    const where: Prisma.ContactWhereInput = mergeClientListScope({}, lifecycleScope);
    const typeFilter = contactType ?? role;
    if (typeFilter) where.role = typeFilter as ContactRole;
    if (search) where.OR = contactDirectorySearchOr(search);
    if (lifecycleScope !== 'trash') where.mergedIntoId = null;

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: CONTACT_LIST_INCLUDE,
        orderBy: {
          [resolveSortField(sortBy, CONTACT_SORT_FIELDS, 'createdAt')]:
            normalizeSortDirection(sortOrder),
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        extraPhones: { select: CONTACT_EXTRA_PHONE_SELECT, orderBy: { createdAt: 'asc' } },
        companies: true,
        projects: { select: { id: true, code: true, name: true } },
        leads: { select: { id: true, code: true, status: true } },
        deals: { select: { id: true, code: true, status: true, amount: true } },
      },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(data: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        role: (data.role as ContactRole) ?? 'CLIENT',
        notes: data.notes,
        messengerLinks: data.messengerLinks
          ? JSON.parse(JSON.stringify(data.messengerLinks))
          : undefined,
      },
    });
  }

  async update(id: string, data: Partial<CreateContactDto>) {
    const existing = await this.findById(id);
    assertEntityIsActive(existing, 'trashedAt', 'Contact');
    return this.prisma.$transaction((tx) => applyContactUpdate(tx, id, data));
  }

  async addExtraPhone(id: string, raw: string | undefined) {
    const stored = assertStoredContactPhone(raw);
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        trashedAt: true,
        extraPhones: { select: { e164: true } },
      },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    assertEntityIsActive(contact, 'trashedAt', 'Contact');
    if (contactOwnsPhone(contact.phone, contact.extraPhones, stored)) {
      throw new BadRequestException({
        statusCode: 400,
        code: CONTACT_PHONE_ERROR.DUPLICATE,
        message: 'This number is already on the Contact.',
      });
    }
    await createExtraContactPhone(this.prisma, id, stored);
    return this.findById(id);
  }

  async removeExtraPhone(id: string, phoneId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    assertEntityIsActive(contact, 'trashedAt', 'Contact');
    const extra = await this.prisma.contactPhone.findFirst({
      where: { id: phoneId, contactId: id },
      select: { id: true },
    });
    if (!extra) throw new NotFoundException(`Extra phone ${phoneId} not found`);
    await this.prisma.contactPhone.delete({ where: { id: phoneId } });
    return this.findById(id);
  }

  async moveToTrash(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    assertEntityIsActive(contact, 'trashedAt', 'Contact');
    return this.prisma.contact.update({
      where: { id },
      data: { trashedAt: new Date() },
    });
  }

  async restoreFromTrash(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { id: true, trashedAt: true, mergedIntoId: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    assertEntityIsTrashed(contact, 'trashedAt', 'Contact');
    if (contact.mergedIntoId) {
      throw new BadRequestException({
        statusCode: 400,
        code: CONTACT_MERGE_ERROR.RESTORE,
        message:
          'This Contact was merged into another card. Restore without un-merge is not allowed.',
      });
    }
    return this.prisma.contact.update({
      where: { id },
      data: { trashedAt: null },
      include: CONTACT_LIST_INCLUDE,
    });
  }

  async findMergeCandidates(query: { q?: string; excludeId?: string }) {
    return findContactMergeCandidates(this.prisma, query);
  }

  async mergeContacts(
    survivorId: string,
    body: { absorbedId: string; fieldChoices?: ContactMergeFieldChoices },
    actor: { id: string; roleSlug: string },
  ) {
    await runContactMerge(this.prisma, this.auditService, {
      survivorId,
      absorbedId: body.absorbedId,
      fieldChoices: body.fieldChoices ?? {},
      actorId: actor.id,
      actorRoleSlug: actor.roleSlug,
    });
    return this.findById(survivorId);
  }

  async permanentlyDeleteFromTrash(id: string, userId: string) {
    await permanentlyDeleteProfileATrashedEntity(this.prisma, this.auditService, {
      key: 'contact',
      id,
      userId,
    });
  }
}
