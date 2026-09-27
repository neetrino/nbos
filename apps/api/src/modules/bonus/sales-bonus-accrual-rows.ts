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

type SalesBonusEntryInsert = {
  employeeId: string;
  orderId: string;
  projectId: string;
  dealId: string;
  type: typeof SALES_BONUS_TYPE;
  amount: Decimal;
  percent: Decimal;
  status: typeof BONUS_STATUS_INCOMING;
  salesBonusSlot: SalesBonusAmountRow['slot'] | null;
  salesAccrualInvoiceId: string;
  calculationSnapshot: InputJsonValue;
  earnedPeriod: string;
};

function toSalesBonusEntryInsert(
  order: { id: string; projectId: string },
  deal: { id: string },
  row: SalesBonusAmountRow,
  snapshotJson: InputJsonValue,
  invoiceId: string,
  slotMode: 'slot' | null,
  earnedPeriod: string,
): SalesBonusEntryInsert {
  return {
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
    earnedPeriod,
  };
}

/**
 * Insert each slot independently. A unique hit on one role must not skip the other.
 * Database uniqueness still collapses a replay of the same slot to one row.
 */
export async function persistSalesBonusRows(
  prisma: InstanceType<typeof PrismaClient>,
  order: { id: string; projectId: string },
  deal: { id: string },
  rows: SalesBonusAmountRow[],
  snapshotJson: InputJsonValue,
  invoiceId: string,
  slotMode: 'slot' | null,
  earnedPeriod: string,
): Promise<boolean> {
  if (rows.length === 0) {
    return false;
  }

  const entries = rows.map((row) =>
    toSalesBonusEntryInsert(order, deal, row, snapshotJson, invoiceId, slotMode, earnedPeriod),
  );
  return insertSalesBonusEntriesIgnoringDuplicates(prisma, entries);
}

async function insertSalesBonusEntriesIgnoringDuplicates(
  prisma: InstanceType<typeof PrismaClient>,
  entries: SalesBonusEntryInsert[],
): Promise<boolean> {
  let created = false;
  for (const entry of entries) {
    const result = await prisma.bonusEntry.createMany({
      data: [entry],
      skipDuplicates: true,
    });
    if (result.count > 0) {
      created = true;
    }
  }
  return created;
}
