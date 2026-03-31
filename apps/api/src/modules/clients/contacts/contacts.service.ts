import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type ContactRole } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreateContactDto {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
}

interface ContactQueryParams {
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ContactsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ContactQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ContactWhereInput = {};
    if (role) where.role = role as ContactRole;
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
        orderBy: { [sortBy]: sortOrder },
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
      },
    });
  }

  async update(id: string, data: Partial<CreateContactDto>) {
    await this.findById(id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role && { role: data.role as ContactRole }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.contact.delete({ where: { id } });
  }
}
