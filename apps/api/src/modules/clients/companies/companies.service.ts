import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type CompanyType,
  type TaxStatus,
  JsonNull,
} from '@nbos/database';
import { splitEntityContactIds } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { permanentlyDeleteProfileATrashedEntity } from '../../../common/lifecycle/profile-a-permanent-delete.ops';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../../common/lifecycle/entity-lifecycle-guards';
import { parseLifecycleScopeFromQuery } from '../../../common/lifecycle/entity-lifecycle-scope';
import { mergeClientListScope } from '../client-entity-lifecycle';
import { syncEntityContactLinks } from '../../crm/shared/sync-entity-contact-links.ops';
import {
  EMPLOYEE_PERSON_SELECT,
  normalizeResponsibleEmployeeId,
} from '../client-responsible-employee.ops';
import {
  COMPANY_LIST_INCLUDE,
  COMPANY_PERSON_SELECT,
  type CompanyQueryParams,
  type CreateCompanyDto,
} from './company-read.ops';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: CompanyQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      search,
      taxStatus,
      type,
      scope,
      responsibleEmployeeId,
    } = params;
    const lifecycleScope = parseLifecycleScopeFromQuery(scope);
    const where: Prisma.CompanyWhereInput = mergeClientListScope({}, lifecycleScope);

    if (search) {
      const personName: Prisma.ContactWhereInput = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { contact: personName },
        { additionalContacts: { some: { contact: personName } } },
      ];
    }
    if (type) where.type = type as CompanyType;
    if (taxStatus) where.taxStatus = taxStatus as TaxStatus;
    if (responsibleEmployeeId) where.responsibleEmployeeId = responsibleEmployeeId;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: COMPANY_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contact: true,
        billingContact: true,
        additionalContacts: {
          include: { contact: { select: COMPANY_PERSON_SELECT } },
        },
        responsibleEmployee: { select: EMPLOYEE_PERSON_SELECT },
        projects: { select: { id: true, code: true, name: true } },
        products: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: { select: { id: true, code: true, name: true } },
          },
        },
        invoices: { select: { id: true, code: true, moneyStatus: true, amount: true } },
        _count: { select: { projects: true, products: true, invoices: true } },
      },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  private async assertActiveContactExists(contactId: string) {
    const c = await this.prisma.contact.findFirst({
      where: { id: contactId, trashedAt: null },
      select: { id: true },
    });
    if (!c) throw new BadRequestException(`Contact ${contactId} not found or is in Trash`);
  }

  private async assertActiveContactsExist(contactIds: string[]) {
    const unique = [...new Set(contactIds.filter(Boolean))];
    for (const id of unique) {
      await this.assertActiveContactExists(id);
    }
  }

  private resolveIncomingContactIds(data: { contactIds?: string[] }): string[] | undefined {
    if (data.contactIds !== undefined) return data.contactIds;
    return undefined;
  }

  async create(data: CreateCompanyDto) {
    const contactIds =
      data.contactIds !== undefined ? data.contactIds : data.contactId ? [data.contactId] : [];
    const { primaryContactId } = splitEntityContactIds(contactIds);
    await this.assertActiveContactsExist(contactIds);

    const billingId =
      data.billingContactId && data.billingContactId !== primaryContactId
        ? data.billingContactId
        : null;
    if (billingId) await this.assertActiveContactExists(billingId);

    const responsibleEmployeeId = await normalizeResponsibleEmployeeId(
      this.prisma,
      data.responsibleEmployeeId,
    );

    const company = await this.prisma.company.create({
      data: {
        name: data.name,
        contactId: primaryContactId,
        billingContactId: billingId,
        type: (data.type as CompanyType) ?? 'LEGAL',
        taxId: data.taxId,
        legalName: data.legalName,
        legalAddress: data.legalAddress,
        bankDetails: data.bankDetails ? JSON.parse(JSON.stringify(data.bankDetails)) : undefined,
        taxStatus: (data.taxStatus as TaxStatus) ?? 'TAX',
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        country: data.country ?? undefined,
        notes: data.notes,
        ...(responsibleEmployeeId !== undefined && { responsibleEmployeeId }),
      },
    });

    await syncEntityContactLinks(this.prisma, 'company', company.id, contactIds);

    return this.findById(company.id);
  }

  async update(id: string, data: Partial<CreateCompanyDto>) {
    const existing = await this.findById(id);
    assertEntityIsActive(existing, 'trashedAt', 'Company');

    if (data.taxStatus !== undefined && data.taxStatus !== existing.taxStatus) {
      throw new BadRequestException('Tax status cannot be changed after company creation.');
    }

    const incomingContactIds = this.resolveIncomingContactIds(data);
    let resolvedContactId: string | null | undefined = undefined;
    if (incomingContactIds !== undefined) {
      await this.assertActiveContactsExist(incomingContactIds);
      const synced = await syncEntityContactLinks(this.prisma, 'company', id, incomingContactIds);
      resolvedContactId = synced.primaryContactId;
    } else if (data.contactId !== undefined) {
      if (data.contactId) {
        await this.assertActiveContactExists(data.contactId);
        resolvedContactId = data.contactId;
      } else {
        resolvedContactId = null;
      }
    }

    const responsibleEmployeeId = await normalizeResponsibleEmployeeId(
      this.prisma,
      data.responsibleEmployeeId,
    );

    let billingContactId: string | null | undefined = undefined;
    if (data.billingContactId !== undefined) {
      if (data.billingContactId === null || data.billingContactId === '') {
        billingContactId = null;
      } else {
        await this.assertActiveContactExists(data.billingContactId);
        const primary = resolvedContactId !== undefined ? resolvedContactId : existing.contactId;
        billingContactId = data.billingContactId === primary ? null : data.billingContactId;
      }
    }

    await this.prisma.company.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(resolvedContactId !== undefined && { contactId: resolvedContactId }),
        ...(data.type && { type: data.type as CompanyType }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.legalName !== undefined && { legalName: data.legalName }),
        ...(data.legalAddress !== undefined && { legalAddress: data.legalAddress }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.bankDetails !== undefined && {
          bankDetails: data.bankDetails ? JSON.parse(JSON.stringify(data.bankDetails)) : JsonNull,
        }),
        ...(billingContactId !== undefined && { billingContactId }),
        ...(responsibleEmployeeId !== undefined && { responsibleEmployeeId }),
      },
    });

    return this.findById(id);
  }

  async moveToTrash(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    assertEntityIsActive(company, 'trashedAt', 'Company');
    return this.prisma.company.update({
      where: { id },
      data: { trashedAt: new Date() },
    });
  }

  async restoreFromTrash(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    assertEntityIsTrashed(company, 'trashedAt', 'Company');
    return this.prisma.company.update({
      where: { id },
      data: { trashedAt: null },
      include: COMPANY_LIST_INCLUDE,
    });
  }

  async permanentlyDeleteFromTrash(id: string, userId: string) {
    await permanentlyDeleteProfileATrashedEntity(this.prisma, this.auditService, {
      key: 'company',
      id,
      userId,
    });
  }
}
