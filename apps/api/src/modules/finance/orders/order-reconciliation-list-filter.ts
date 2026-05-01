import { join, sql } from '@nbos/database';

export type OrderReconciliationListGap = 'uninvoiced' | 'outstanding';

export function parseOrderReconciliationListGap(
  raw: string | undefined,
): OrderReconciliationListGap | null {
  if (raw === 'uninvoiced' || raw === 'outstanding') {
    return raw;
  }
  return null;
}

interface OrdersWhereSqlParams {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  projectId?: string;
  /** When set, restricts reconciliation queries to orders linked to this partner. */
  partnerId?: string;
  search?: string;
  gap: OrderReconciliationListGap;
}

export function buildOrdersReconciliationWhereSql(params: OrdersWhereSqlParams) {
  const conditions: ReturnType<typeof sql>[] = [];

  if (params.dateFrom) {
    conditions.push(sql`o.created_at >= ${new Date(params.dateFrom)}`);
  }
  if (params.dateTo) {
    conditions.push(sql`o.created_at <= ${new Date(params.dateTo)}`);
  }
  if (params.status) {
    conditions.push(sql`o.status = ${params.status}::"OrderStatusEnum"`);
  }
  if (params.projectId) {
    conditions.push(sql`o.project_id = ${params.projectId}`);
  }
  if (params.partnerId) {
    conditions.push(sql`o.partner_id = ${params.partnerId}`);
  }
  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    const pattern = `%${escapeLikePattern(trimmedSearch)}%`;
    conditions.push(sql`o.code ILIKE ${pattern} ESCAPE '\\'`);
  }

  conditions.push(buildGapConditionSql(params.gap));

  return join(conditions, ' AND ');
}

function buildGapConditionSql(gap: OrderReconciliationListGap) {
  if (gap === 'uninvoiced') {
    return sql`COALESCE((SELECT SUM(i.amount) FROM invoices i WHERE i.order_id = o.id), 0) < o.total_amount`;
  }
  return sql`${orderPaidThroughInvoicesSql()} < o.total_amount`;
}

/** Total payments recorded on invoices linked to order alias `o` (reconciliation paid total). */
export function orderPaidThroughInvoicesSql() {
  return sql`COALESCE((SELECT SUM(p.amount) FROM payments p INNER JOIN invoices i ON i.id = p.invoice_id WHERE i.order_id = o.id), 0)`;
}

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
