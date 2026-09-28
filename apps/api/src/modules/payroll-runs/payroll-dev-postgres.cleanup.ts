import type { PrismaClient } from '@nbos/database';

import { PAYROLL_DEV_MARKER, type DevPayrollIds } from './payroll-dev-postgres.ids';

/** Deletes only the ids this run created. Refuses to continue when a marked row remains. */
export async function deleteDevPayrollGraph(
  prisma: PrismaClient,
  ids: DevPayrollIds,
): Promise<void> {
  const paymentIds = await loadPaymentIds(prisma, ids);
  await deleteJournals(prisma, ids, paymentIds);
  await deletePayrollRows(prisma, ids);
  await deleteCrmRows(prisma, ids);
  await deleteCreatedPostingMonths(prisma, ids);
  const leftovers = await listDevPayrollLeftovers(prisma, ids, paymentIds);
  if (leftovers.length > 0) {
    throw new Error(`Dev payroll cleanup left rows: ${leftovers.join(', ')}`);
  }
}

async function loadPaymentIds(prisma: PrismaClient, ids: DevPayrollIds): Promise<string[]> {
  if (ids.expenseIds.length === 0 && ids.invoiceIds.length === 0) {
    return ids.paymentIds;
  }
  const [expensePayments, invoicePayments] = await Promise.all([
    ids.expenseIds.length === 0
      ? Promise.resolve([])
      : prisma.expensePayment.findMany({
          where: { expenseId: { in: ids.expenseIds } },
          select: { id: true },
        }),
    ids.invoiceIds.length === 0
      ? Promise.resolve([])
      : prisma.payment.findMany({
          where: { invoiceId: { in: ids.invoiceIds } },
          select: { id: true },
        }),
  ]);
  return [
    ...new Set([
      ...ids.paymentIds,
      ...expensePayments.map((row) => row.id),
      ...invoicePayments.map((row) => row.id),
    ]),
  ];
}

async function deleteJournals(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  paymentIds: string[],
): Promise<void> {
  const sourceIds = [...paymentIds, ...ids.invoiceIds, ...ids.expenseIds];
  if (sourceIds.length === 0 && !ids.orderId && !ids.projectId) {
    return;
  }
  await prisma.operationalJournalEntry.deleteMany({
    where: {
      OR: [
        ...(ids.orderId ? [{ orderId: ids.orderId }] : []),
        ...(ids.projectId ? [{ projectId: ids.projectId }] : []),
        ...(sourceIds.length > 0 ? [{ sourceId: { in: sourceIds } }] : []),
      ],
    },
  });
}

async function deletePayrollRows(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  if (ids.orderId) {
    await prisma.partnerAccrual.deleteMany({ where: { orderId: ids.orderId } });
    await prisma.productBonusPool.deleteMany({ where: { orderId: ids.orderId } });
    await prisma.bonusEntry.deleteMany({ where: { orderId: ids.orderId } });
  }
  if (ids.entryIds.length > 0) {
    await prisma.bonusEntry.deleteMany({ where: { id: { in: ids.entryIds } } });
  }
  if (ids.payrollRunIds.length > 0) {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: ids.payrollRunIds } } });
    await prisma.payrollRun.deleteMany({ where: { id: { in: ids.payrollRunIds } } });
  }
  if (ids.expenseIds.length > 0) {
    await prisma.expense.deleteMany({ where: { id: { in: ids.expenseIds } } });
  }
  if (ids.profileIds.length > 0) {
    await prisma.compensationProfile.deleteMany({ where: { id: { in: ids.profileIds } } });
  }
  if (ids.employeeIds.length > 0) {
    await prisma.kpiResult.deleteMany({ where: { employeeId: { in: ids.employeeIds } } });
  }
}

async function deleteCrmRows(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  if (ids.invoiceIds.length > 0) {
    await prisma.payment.deleteMany({ where: { invoiceId: { in: ids.invoiceIds } } });
    await prisma.invoice.deleteMany({ where: { id: { in: ids.invoiceIds } } });
  }
  await deleteById(prisma.order, ids.orderId);
  await deleteById(prisma.deal, ids.dealId);
  await deleteById(prisma.project, ids.projectId);
  await deleteById(prisma.company, ids.companyId);
  await deleteById(prisma.contact, ids.contactId);
  if (ids.employeeIds.length > 0) {
    await prisma.employee.deleteMany({ where: { id: { in: ids.employeeIds } } });
  }
  await deleteById(prisma.role, ids.roleId);
  if (ids.policyId) {
    await prisma.salesBonusPolicy.deleteMany({
      where: { id: ids.policyId, effectiveTo: null },
    });
  }
}

async function deleteCreatedPostingMonths(prisma: PrismaClient, ids: DevPayrollIds): Promise<void> {
  for (const monthKey of ids.createdPostingMonths) {
    const period = await prisma.financePostingPeriod.findUnique({
      where: { monthKey },
      select: { id: true, _count: { select: { journalEntries: true } } },
    });
    if (period && period._count.journalEntries === 0) {
      await prisma.financePostingPeriod.delete({ where: { id: period.id } });
    }
  }
}

async function listDevPayrollLeftovers(
  prisma: PrismaClient,
  ids: DevPayrollIds,
  paymentIds: string[],
): Promise<string[]> {
  const leftover: string[] = [];
  await pushCount(leftover, 'payrollRun', ids.payrollRunIds, (id) =>
    prisma.payrollRun.count({ where: { id } }),
  );
  await pushCount(leftover, 'expense', ids.expenseIds, (id) =>
    prisma.expense.count({ where: { id } }),
  );
  await pushCount(leftover, 'employee', ids.employeeIds, (id) =>
    prisma.employee.count({ where: { id, notes: PAYROLL_DEV_MARKER } }),
  );
  await pushCount(leftover, 'payment', paymentIds, (id) =>
    prisma.expensePayment.count({ where: { id } }),
  );
  if (ids.orderId && (await prisma.bonusEntry.count({ where: { orderId: ids.orderId } })) > 0) {
    leftover.push(`bonusEntry:${ids.orderId}`);
  }
  return leftover;
}

async function pushCount(
  leftover: string[],
  label: string,
  ids: string[],
  count: (id: string) => Promise<number>,
): Promise<void> {
  for (const id of ids) {
    if ((await count(id)) > 0) {
      leftover.push(`${label}:${id}`);
    }
  }
}

async function deleteById(
  delegate: { deleteMany: (args: { where: { id: string } }) => Promise<unknown> },
  id: string | undefined,
): Promise<void> {
  if (!id) {
    return;
  }
  await delegate.deleteMany({ where: { id } });
}
