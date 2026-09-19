import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  decimalToNullableString,
  type DeliveryBaseProfileFinancialDto,
  type DeliveryFunctionPriceFinancialDto,
  type DeliveryRoleRateFinancialDto,
  type RoleRateWriteInput,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class DeliveryCompensationRulesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listFunctionPrices(): Promise<DeliveryFunctionPriceFinancialDto[]> {
    const rows = await this.prisma.deliveryFunctionPriceVersion.findMany({
      orderBy: [{ functionId: 'asc' }, { version: 'desc' }],
      include: { roleUnits: { orderBy: { roleKey: 'asc' } } },
    });
    return rows.map((row) => ({
      id: row.id,
      functionId: row.functionId,
      version: row.version,
      status: row.status,
      roleUnits: row.roleUnits.map((unit) => ({
        roleKey: unit.roleKey,
        unitKind: unit.unitKind,
        units: decimalToNullableString(unit.units),
      })),
    }));
  }

  async listBaseProfiles(): Promise<DeliveryBaseProfileFinancialDto[]> {
    const rows = await this.prisma.deliveryBaseProfileVersion.findMany({
      orderBy: [{ profileKey: 'asc' }, { version: 'desc' }],
      include: {
        roleUnits: { orderBy: { roleKey: 'asc' } },
        includedFunctions: { select: { functionId: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      profileKey: row.profileKey,
      version: row.version,
      status: row.status,
      roleUnits: row.roleUnits.map((unit) => ({
        roleKey: unit.roleKey,
        unitKind: unit.unitKind,
        units: decimalToNullableString(unit.units),
      })),
      includedFunctionIds: row.includedFunctions.map((link) => link.functionId),
    }));
  }

  async listRoleRates(): Promise<DeliveryRoleRateFinancialDto[]> {
    const rows = await this.prisma.deliveryRoleRateVersion.findMany({
      orderBy: [{ roleKey: 'asc' }, { version: 'desc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      roleKey: row.roleKey,
      currency: row.currency,
      rate: row.rate.toString(),
      version: row.version,
      status: row.status,
    }));
  }

  async createRoleRateDraft(input: RoleRateWriteInput): Promise<DeliveryRoleRateFinancialDto> {
    const latest = await this.prisma.deliveryRoleRateVersion.findFirst({
      where: { roleKey: input.roleKey },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const row = await this.prisma.deliveryRoleRateVersion.create({
      data: {
        roleKey: input.roleKey,
        currency: input.currency,
        rate: input.rate,
        version: (latest?.version ?? 0) + 1,
        status: 'DRAFT',
        effectiveFrom: new Date(input.effectiveFrom),
      },
    });
    return {
      id: row.id,
      roleKey: row.roleKey,
      currency: row.currency,
      rate: row.rate.toString(),
      version: row.version,
      status: row.status,
    };
  }
}
