import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type ContactRole, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { resolveSortField, normalizeSortDirection } from '../../../common/utils/sort-order';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../../common/lifecycle/entity-lifecycle-guards';
import { parseLifecycleScopeFromQuery } from '../../../common/lifecycle/entity-lifecycle-scope';
import { mergeClientListScope } from '../client-entity-lifecycle';

const CONTACT_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']);

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
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

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
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          companies: { select: { id: true, name: true } },
          _count: { select: { projects: true, leads: true, deals: true } },
        },
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
    return this.prisma.contact.update({
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
      include: {
        companies: { select: { id: true, name: true } },
        _count: { select: { projects: true, leads: true, deals: true } },
      },
    });
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
      select: { id: true, trashedAt: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    assertEntityIsTrashed(contact, 'trashedAt', 'Contact');
    return this.prisma.contact.update({
      where: { id },
      data: { trashedAt: null },
      include: {
        companies: { select: { id: true, name: true } },
        _count: { select: { projects: true, leads: true, deals: true } },
      },
    });
  }

  /** @deprecated Use moveToTrash — kept for transitional callers. */
  async delete(id: string) {
    return this.moveToTrash(id);
  }
}
