import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type CompanyType, type TaxStatus } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreateCompanyDto {
  name: string;
  contactId: string;
  type?: string;
  taxId?: string;
  legalAddress?: string;
  bankDetails?: Record<string, unknown>;
  taxStatus?: string;
  notes?: string;
}

interface CompanyQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}

@Injectable()
export class CompaniesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: CompanyQueryParams) {
    const { page = 1, pageSize = 20, search, type } = params;
    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type as CompanyType;

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
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
        projects: { select: { id: true, code: true, name: true, type: true } },
        invoices: { select: { id: true, code: true, status: true, amount: true } },
      },
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async create(data: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: data.name,
        contactId: data.contactId,
        type: (data.type as CompanyType) ?? 'LEGAL',
        taxId: data.taxId,
        legalAddress: data.legalAddress,
        bankDetails: data.bankDetails ? JSON.parse(JSON.stringify(data.bankDetails)) : undefined,
        taxStatus: (data.taxStatus as TaxStatus) ?? 'TAX',
        notes: data.notes,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Partial<CreateCompanyDto>) {
    await this.findById(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.type && { type: data.type as CompanyType }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.legalAddress !== undefined && { legalAddress: data.legalAddress }),
        ...(data.taxStatus && { taxStatus: data.taxStatus as TaxStatus }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.company.delete({ where: { id } });
  }
}
