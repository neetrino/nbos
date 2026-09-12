import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  parseWritableInterfaceLocale,
  type InterfaceLocalePreference,
  type WritableInterfaceLocale,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class EmployeeInterfaceLocaleService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getPreferences(employeeId: string): Promise<InterfaceLocalePreference> {
    const row = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { interfaceLocale: true },
    });
    if (!row) {
      throw new NotFoundException('Employee record not found for this user');
    }
    return { interfaceLocale: parseWritableInterfaceLocale(row.interfaceLocale) };
  }

  async updatePreferences(
    employeeId: string,
    interfaceLocale: WritableInterfaceLocale,
  ): Promise<InterfaceLocalePreference> {
    const row = await this.prisma.employee.update({
      where: { id: employeeId },
      data: { interfaceLocale },
      select: { interfaceLocale: true },
    });
    return { interfaceLocale: parseWritableInterfaceLocale(row.interfaceLocale) };
  }
}
