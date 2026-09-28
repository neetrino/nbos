import { Decimal, PrismaClient, type InputJsonValue, type TransactionClient } from '@nbos/database';
import {
  hasRecurringSalesAccrualForInvoiceEmployee,
  sumSalesAccrualOnOrder,
  type AccrualIdempotencyDb,
} from './sales-bonus-accrual-idempotency';
import {
  buildSalesBonusAmountRows,
  persistSalesBonusRows,
  SALES_BONUS_TYPE,
  type SalesBonusAmountRow,
} from './sales-bonus-accrual-rows';
import {
  remainingSalesOrderAccrualCap,
  uncappedSalesRoleAmount,
} from './sales-bonus-combined-accrual';
import { lockSalesOrderAccrual } from './sales-bonus-order-accrual-lock';

type CappedSalesWriteDeal = {
  id: string;
  sellerId: string;
  sellerAssistantId: string | null;
};

type CappedSalesWriteInput = {
  prisma: InstanceType<typeof PrismaClient>;
  order: { id: string; projectId: string };
  deal: CappedSalesWriteDeal;
  policy: { sellerPercent: Decimal; assistantPercent: Decimal };
  baseAmount: Decimal;
  snapshotJson: InputJsonValue;
  invoiceId: string;
  slotMode: 'slot' | null;
  earnedPeriod: string;
};

type SalesRole = SalesBonusAmountRow['slot'];

const MONEY_DECIMAL_PLACES = 2;
const ZERO = new Decimal(0);

/**
 * Lock the order, then allocate against every SALES amount already stored
 * (including this invoice). Missing roles cannot refill a spent envelope.
 */
export async function persistLockedCappedSalesBonusRows(
  input: CappedSalesWriteInput,
): Promise<boolean> {
  return input.prisma.$transaction(async (tx: TransactionClient) => {
    await lockSalesOrderAccrual(tx, input.order.id);
    const rows = await collectWritableCappedRows(tx, input);
    return persistSalesBonusRows(
      tx,
      input.order,
      input.deal,
      rows,
      input.snapshotJson,
      input.invoiceId,
      input.slotMode,
      input.earnedPeriod,
    );
  });
}

/**
 * Allocate remaining envelope to roles that are still missing. Do not rebuild a
 * fresh 80/20 of the leftover when one role already consumed part of the cap.
 */
export async function collectWritableCappedRows(
  db: AccrualIdempotencyDb,
  input: CappedSalesWriteInput,
): Promise<SalesBonusAmountRow[]> {
  const accrued = await sumSalesAccrualOnOrder(db, input.order.id);
  const remaining = remainingSalesOrderAccrualCap(accrued);
  if (remaining.lte(0)) {
    return [];
  }
  const needed = await rolesStillNeeded(db, input);
  if (needed.seller && needed.assistant) {
    return buildSalesBonusAmountRows(input.deal, input.policy, input.baseAmount, remaining);
  }
  return allocateRemainderToMissingRoles(input, remaining, needed);
}

async function rolesStillNeeded(
  db: AccrualIdempotencyDb,
  input: CappedSalesWriteInput,
): Promise<{ seller: boolean; assistant: boolean }> {
  if (input.slotMode === 'slot') {
    const present = await loadPresentSlottedRoles(db, input.order.id);
    return {
      seller: !present.has('SELLER'),
      assistant: Boolean(input.deal.sellerAssistantId) && !present.has('ASSISTANT'),
    };
  }
  return {
    seller: !(await hasRecurringSalesAccrualForInvoiceEmployee(
      db,
      input.order.id,
      input.invoiceId,
      input.deal.sellerId,
      'SELLER',
    )),
    assistant: await isRecurringAssistantMissing(db, input),
  };
}

async function isRecurringAssistantMissing(
  db: AccrualIdempotencyDb,
  input: CappedSalesWriteInput,
): Promise<boolean> {
  const assistantId = input.deal.sellerAssistantId;
  if (!assistantId) {
    return false;
  }
  return !(await hasRecurringSalesAccrualForInvoiceEmployee(
    db,
    input.order.id,
    input.invoiceId,
    assistantId,
    'ASSISTANT',
  ));
}

async function loadPresentSlottedRoles(
  db: AccrualIdempotencyDb,
  orderId: string,
): Promise<Set<SalesRole>> {
  const rows = await db.bonusEntry.findMany({
    where: { orderId, type: SALES_BONUS_TYPE, salesBonusSlot: { not: null } },
    select: { salesBonusSlot: true },
  });
  const present = new Set<SalesRole>();
  for (const row of rows) {
    if (row.salesBonusSlot === 'SELLER' || row.salesBonusSlot === 'ASSISTANT') {
      present.add(row.salesBonusSlot);
    }
  }
  return present;
}

/**
 * Give each missing role up to its uncapped share of the original base, limited
 * by the remaining order envelope so a complete pair stays within 300,000.
 */
function allocateRemainderToMissingRoles(
  input: CappedSalesWriteInput,
  remaining: Decimal,
  needed: { seller: boolean; assistant: boolean },
): SalesBonusAmountRow[] {
  const rows: SalesBonusAmountRow[] = [];
  let left = remaining;
  if (needed.seller) {
    const amount = takeRoleRemainder(left, input.baseAmount, input.policy.sellerPercent);
    if (amount.gt(0)) {
      rows.push({
        employeeId: input.deal.sellerId,
        slot: 'SELLER',
        amount,
        percent: input.policy.sellerPercent,
      });
      left = left.minus(amount);
    }
  }
  if (needed.assistant && input.deal.sellerAssistantId) {
    const amount = takeRoleRemainder(left, input.baseAmount, input.policy.assistantPercent);
    if (amount.gt(0)) {
      rows.push({
        employeeId: input.deal.sellerAssistantId,
        slot: 'ASSISTANT',
        amount,
        percent: input.policy.assistantPercent,
      });
    }
  }
  return rows;
}

function takeRoleRemainder(remaining: Decimal, baseAmount: Decimal, percent: Decimal): Decimal {
  if (remaining.lte(0)) {
    return ZERO;
  }
  const uncapped = roundBonusMoney(uncappedSalesRoleAmount(baseAmount, percent));
  return Decimal.min(remaining, uncapped);
}

function roundBonusMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}
