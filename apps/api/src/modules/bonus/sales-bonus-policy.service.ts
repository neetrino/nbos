import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  FINANCE_BONUSES_MODULE,
  assertCompanyWideFinanceAccess,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';
import {
  deactivateSalesBonusPolicyVersion,
  publishSalesBonusPolicyVersion,
  reactivateSalesBonusPolicyVersion,
} from './sales-bonus-policy-version';

export interface UpdateSalesBonusPolicyDto {
  sellerPercent?: number;
  assistantPercent?: number;
  isActive?: boolean;
}

@Injectable()
export class SalesBonusPolicyService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listAll(actor: FinancePayActor) {
    assertCompanyWideFinanceAccess(actor, FINANCE_BONUSES_MODULE, 'VIEW');
    return this.prisma.salesBonusPolicy.findMany({
      orderBy: [{ fromCategory: 'asc' }, { paymentModel: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async update(actor: FinancePayActor, id: string, data: UpdateSalesBonusPolicyDto) {
    assertCompanyWideFinanceAccess(actor, FINANCE_BONUSES_MODULE, 'EDIT');
    const row = await this.prisma.salesBonusPolicy.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Sales bonus policy ${id} not found`);
    }
    assertSalesBonusPercent(data.sellerPercent, 'sellerPercent');
    assertSalesBonusPercent(data.assistantPercent, 'assistantPercent');
    const now = new Date();
    if (data.isActive === false) {
      return deactivateSalesBonusPolicyVersion(this.prisma, row, now);
    }
    const published = await publishSalesBonusPolicyVersion(
      this.prisma,
      row,
      {
        sellerPercent: data.sellerPercent ?? Number(row.sellerPercent),
        assistantPercent: data.assistantPercent ?? Number(row.assistantPercent),
      },
      now,
    );
    if (published) {
      return published;
    }
    if (data.isActive === true && !row.isActive) {
      return reactivateSalesBonusPolicyVersion(this.prisma, row, now);
    }
    return row;
  }
}

function assertSalesBonusPercent(value: number | undefined, field: string): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new BadRequestException(`${field} must be between 0 and 100`);
  }
}
