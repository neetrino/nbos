import { PrismaClient } from '@nbos/database';

type AuditDb = Pick<InstanceType<typeof PrismaClient>, 'auditLog' | 'employee'>;

/** Serialized audit row for payroll run detail (read-only). */
export interface PayrollAuditTrailRow {
  id: string;
  action: string;
  createdAt: string;
  changes: unknown;
  actor: { id: string; firstName: string; lastName: string };
}

export async function loadPayrollRunAuditTrail(
  db: AuditDb,
  entityType: string,
  entityId: string,
): Promise<PayrollAuditTrailRow[]> {
  const rows = await db.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'asc' },
  });
  if (rows.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(
      rows
        .map((row) => row.userId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
  const employees = await db.employee.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const byId = new Map(employees.map((e) => [e.id, e] as const));

  return rows.map((row) => {
    const actorKey = row.userId ?? row.actorId ?? 'unknown';
    return {
      id: row.id,
      action: row.action,
      createdAt: row.createdAt.toISOString(),
      changes: row.changes ?? null,
      actor: byId.get(actorKey) ?? {
        id: actorKey,
        firstName: '',
        lastName: 'Unknown user',
      },
    };
  });
}
