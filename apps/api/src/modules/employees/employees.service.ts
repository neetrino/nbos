import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class EmployeesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.prisma.employee.findUnique({ where: { clerkUserId } });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({ where: { email } });
  }

  async upsertFromClerk(data: {
    clerkUserId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.employee.upsert({
      where: { clerkUserId: data.clerkUserId },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      create: {
        clerkUserId: data.clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'DEVELOPER',
      },
    });
  }
}
