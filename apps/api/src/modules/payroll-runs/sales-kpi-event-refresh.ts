import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

import {
  earnedPeriodFromUtcDate,
  refreshSalesBonusesForEarnedMonth,
  refreshSalesBonusesForEmployeesEarnedMonth,
} from '../bonus/sales-bonus-kpi-payable';

const logger = new Logger('SalesKpiEventRefresh');

export { earnedPeriodFromUtcDate };

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'bonusEntry' | 'kpiResult' | 'kpiPolicy' | 'compensationProfile' | 'invoice'
>;

/**
 * Refreshes month KPI + open Sales bonus payables. Failures are logged, not thrown.
 */
export async function refreshSalesKpiForEarnedPeriodSafe(
  db: Db,
  params: { employeeId: string; earnedPeriod: string },
): Promise<void> {
  try {
    await refreshSalesBonusesForEarnedMonth(db, params);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    logger.warn(
      `Sales KPI refresh failed for employee ${params.employeeId} period ${params.earnedPeriod}: ${message}`,
    );
  }
}

export async function refreshSalesKpiForEmployeesEarnedPeriod(
  db: Db,
  employeeIds: string[],
  earnedPeriod: string,
): Promise<void> {
  try {
    await refreshSalesBonusesForEmployeesEarnedMonth(db, employeeIds, earnedPeriod);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    logger.warn(`Sales KPI refresh failed for period ${earnedPeriod}: ${message}`);
  }
}

/** After client payment: refresh seller KPI for the payment month (accrual also refreshes). */
export async function refreshSalesKpiAfterClientPayment(
  db: Db,
  params: { invoiceId: string; paymentDate: Date },
): Promise<void> {
  const invoice = await db.invoice.findUnique({
    where: { id: params.invoiceId },
    select: {
      order: {
        select: {
          deal: { select: { sellerId: true, sellerAssistantId: true } },
        },
      },
    },
  });
  const deal = invoice?.order?.deal;
  if (!deal) {
    return;
  }
  const earnedPeriod = earnedPeriodFromUtcDate(params.paymentDate);
  await refreshSalesKpiForEmployeesEarnedPeriod(
    db,
    [deal.sellerId, deal.sellerAssistantId ?? ''].filter(Boolean),
    earnedPeriod,
  );
}
