import { Decimal, PrismaClient, type InputJsonValue } from '@nbos/database';

export const SALES_BONUS_TYPE = 'SALES' as const;
export const BONUS_STATUS_INCOMING = 'INCOMING' as const;

export type SalesBonusAmountRow = {
  employeeId: string;
  slot: 'SELLER' | 'ASSISTANT';
  amount: Decimal;
  percent: Decimal;
};

export function buildSalesBonusAmountRows(
  deal: { sellerId: string; sellerAssistantId: string | null },
  policy: { sellerPercent: Decimal; assistantPercent: Decimal },
  baseAmount: Decimal,
): SalesBonusAmountRow[] {
  const sellerAmount = baseAmount.mul(policy.sellerPercent).div(new Decimal(100));
  const assistantAmount = baseAmount.mul(policy.assistantPercent).div(new Decimal(100));

  const rows: SalesBonusAmountRow[] = [];

  if (sellerAmount.gt(0)) {
    rows.push({
      employeeId: deal.sellerId,
      slot: 'SELLER',
      amount: sellerAmount,
      percent: policy.sellerPercent,
    });
  }

  if (assistantAmount.gt(0) && deal.sellerAssistantId) {
    rows.push({
      employeeId: deal.sellerAssistantId,
      slot: 'ASSISTANT',
      amount: assistantAmount,
      percent: policy.assistantPercent,
    });
  }

  return rows;
}

export async function persistSalesBonusRows(
  prisma: InstanceType<typeof PrismaClient>,
  order: { id: string; projectId: string },
  deal: { id: string },
  rows: SalesBonusAmountRow[],
  snapshotJson: InputJsonValue,
  invoiceId: string,
  slotMode: 'slot' | null,
): Promise<void> {
  await prisma.$transaction(
    rows.map((row) =>
      prisma.bonusEntry.create({
        data: {
          employeeId: row.employeeId,
          orderId: order.id,
          projectId: order.projectId,
          dealId: deal.id,
          type: SALES_BONUS_TYPE,
          amount: row.amount,
          percent: row.percent,
          status: BONUS_STATUS_INCOMING,
          salesBonusSlot: slotMode ? row.slot : null,
          salesAccrualInvoiceId: invoiceId,
          calculationSnapshot: snapshotJson,
        },
      }),
    ),
  );
}
