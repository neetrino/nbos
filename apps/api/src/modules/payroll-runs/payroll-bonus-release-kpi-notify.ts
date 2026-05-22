import type { PrismaClient } from '@nbos/database';
import { notifyBonusKpiReducedOnAttach } from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';

/** Plain-language body for wallet in-app notify when sales KPI reduces attach amount. */
export function formatBonusKpiReducedNotifyBody(input: {
  orderCode: string;
  releaseAmount: string;
  includedAmount: string;
  payrollMonth: string;
}): string {
  const month = input.payrollMonth ? ` (${input.payrollMonth})` : '';
  return (
    `Order ${input.orderCode}: release ${input.releaseAmount} — only ${input.includedAmount}` +
    ` included in payroll${month} after sales KPI.`
  );
}

/**
 * After attach, notify employees whose SALES release payout was reduced by run KPI.
 */
export async function notifySalesKpiReductionsOnAttach(
  prisma: InstanceType<typeof PrismaClient>,
  sink: WalletInAppNotifySink | undefined,
  releaseIds: string[],
): Promise<void> {
  if (releaseIds.length === 0) {
    return;
  }

  const releases = await prisma.bonusRelease.findMany({
    where: { id: { in: releaseIds }, status: 'INCLUDED_IN_PAYROLL' },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      payrollIncludedAmount: true,
      kpiBurnedAmount: true,
      kpiBurnedReason: true,
      bonusEntry: { select: { type: true, order: { select: { code: true } } } },
      payrollRun: { select: { payrollMonth: true } },
    },
  });

  for (const rel of releases) {
    if (rel.bonusEntry.type !== 'SALES') {
      continue;
    }
    const included = rel.payrollIncludedAmount;
    if (included == null || included.gte(rel.amount)) {
      continue;
    }

    const payrollMonth = rel.payrollRun?.payrollMonth ?? '';
    const releaseLabel = rel.amount.toFixed(2);
    const includedLabel = included.toFixed(2);

    const baseBody = formatBonusKpiReducedNotifyBody({
      orderCode: rel.bonusEntry.order.code,
      releaseAmount: releaseLabel,
      includedAmount: includedLabel,
      payrollMonth,
    });
    const reasonSuffix =
      rel.kpiBurnedReason?.trim() != null && rel.kpiBurnedReason.trim() !== ''
        ? ` ${rel.kpiBurnedReason.trim()}`
        : '';

    await notifyBonusKpiReducedOnAttach(sink, {
      employeeId: rel.employeeId,
      releaseId: rel.id,
      orderCode: rel.bonusEntry.order.code,
      body: `${baseBody}${reasonSuffix}`,
      burnedAmount: (rel.kpiBurnedAmount ?? rel.amount.minus(included)).toFixed(2),
    });
  }
}
