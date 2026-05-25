import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type CompanyType,
  type TaxStatus,
  JsonNull,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreateCompanyDto {
  name: string;
  contactId: string;
  billingContactId?: string | null;
  type?: string;
  taxId?: string;
  legalAddress?: string;
  bankDetails?: Record<string, unknown> | null;
  taxStatus?: string;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  notes?: string;
}

interface CompanyQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  taxStatus?: string;
  type?: string;
}

@Injectable()
export class CompaniesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: CompanyQueryParams) {
    const { page = 1, pageSize = 20, search, taxStatus, type } = params;
    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        {
          contact: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
    if (type) where.type = type as CompanyType;
    if (taxStatus) where.taxStatus = taxStatus as TaxStatus;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          billingContact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { projects: true, invoices: true } },
        },
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
        projects: { select: { id: true, code: true, name: true } },
        invoices: { select: { id: true, code: true, moneyStatus: true, amount: true } },
        _count: { select: { projects: true, invoices: true } },
      },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  private async assertContactExists(contactId: string) {
    const c = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true },
    });
    if (!c) throw new BadRequestException(`Contact ${contactId} not found`);
  }

  async create(data: CreateCompanyDto) {
    await this.assertContactExists(data.contactId);
    const billingId =
      data.billingContactId && data.billingContactId !== data.contactId
        ? data.billingContactId
        : null;
    if (billingId) await this.assertContactExists(billingId);

    return this.prisma.company.create({
      data: {
        name: data.name,
        contactId: data.contactId,
        billingContactId: billingId,
        type: (data.type as CompanyType) ?? 'LEGAL',
        taxId: data.taxId,
        legalAddress: data.legalAddress,
        bankDetails: data.bankDetails ? JSON.parse(JSON.stringify(data.bankDetails)) : undefined,
        taxStatus: (data.taxStatus as TaxStatus) ?? 'TAX',
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        country: data.country ?? undefined,
        notes: data.notes,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        billingContact: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { projects: true, invoices: true } },
      },
    });
  }

  async update(id: string, data: Partial<CreateCompanyDto>) {
    const existing = await this.findById(id);

    if (data.taxStatus !== undefined && data.taxStatus !== existing.taxStatus) {
      throw new BadRequestException('Tax status cannot be changed after company creation.');
    }

    if (data.contactId) await this.assertContactExists(data.contactId);

    let billingContactId: string | null | undefined = undefined;
    if (data.billingContactId !== undefined) {
      if (data.billingContactId === null || data.billingContactId === '') {
        billingContactId = null;
      } else {
        await this.assertContactExists(data.billingContactId);
        const primary = data.contactId ?? existing.contactId;
        billingContactId = data.billingContactId === primary ? null : data.billingContactId;
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.type && { type: data.type as CompanyType }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.legalAddress !== undefined && { legalAddress: data.legalAddress }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.bankDetails !== undefined && {
          bankDetails: data.bankDetails ? JSON.parse(JSON.stringify(data.bankDetails)) : JsonNull,
        }),
        ...(billingContactId !== undefined && { billingContactId }),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        billingContact: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { projects: true, invoices: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.company.delete({ where: { id } });
  }
}
