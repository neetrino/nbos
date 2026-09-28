import { Decimal, PrismaClient, type InputJsonValue, type TransactionClient } from '@nbos/database';
import {
  hasRecurringSalesAccrualForInvoiceEmployee,
  sumSalesAccrualOnOrder,
  type AccrualIdempotencyDb,
} from './sales-bonus-accrual-idempotency';
import {
  buildSalesBonusAmountRows,
  persistSalesBonusRows,
  type SalesBonusAmountRow,
} from './sales-bonus-accrual-rows';
import { remainingSalesOrderAccrualCap } from './sales-bonus-combined-accrual';
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

async function collectWritableCappedRows(
  db: AccrualIdempotencyDb,
  input: CappedSalesWriteInput,
): Promise<SalesBonusAmountRow[]> {
  const accrued = await sumSalesAccrualOnOrder(db, input.order.id);
  const cap = remainingSalesOrderAccrualCap(accrued);
  const rows = buildSalesBonusAmountRows(input.deal, input.policy, input.baseAmount, cap);
  if (input.slotMode === 'slot') {
    return rows;
  }
  return filterMissingRecurringRows(db, input, rows);
}

async function filterMissingRecurringRows(
  db: AccrualIdempotencyDb,
  input: CappedSalesWriteInput,
  rows: SalesBonusAmountRow[],
): Promise<SalesBonusAmountRow[]> {
  const missing: SalesBonusAmountRow[] = [];
  for (const row of rows) {
    const exists = await hasRecurringSalesAccrualForInvoiceEmployee(
      db,
      input.order.id,
      input.invoiceId,
      row.employeeId,
      row.slot,
    );
    if (!exists) {
      missing.push(row);
    }
  }
  return missing;
}
