import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { runSalesKpiMonthClose } from './run-sales-kpi-month-close';
import type { SalesKpiMonthCloseResultDto } from './sales-kpi-month-close.types';

@Injectable()
export class SalesKpiMonthCloseService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async run(options?: { earnedPeriod?: string }): Promise<SalesKpiMonthCloseResultDto> {
    const raw = options?.earnedPeriod?.trim();
    if (raw != null && raw.length > 0 && !isValidPayrollMonth(raw)) {
      throw new BadRequestException('earnedPeriod must be YYYY-MM');
    }
    try {
      return await runSalesKpiMonthClose(this.prisma, { earnedPeriod: raw });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      throw new BadRequestException(message);
    }
  }
}
