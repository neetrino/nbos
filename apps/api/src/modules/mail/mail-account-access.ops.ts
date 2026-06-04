import { MailAccountAccessRole, type PrismaClient } from '@nbos/database';
import type { MailAccountAccessEntryRow } from './mail.types';

export function formatEmployeeName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function toAccessEntryRow(row: {
  id: string;
  employeeId: string;
  role: MailAccountAccessRole;
  grantedByEmployeeId: string | null;
  createdAt: Date;
  employee: { firstName: string; lastName: string; email: string };
}): MailAccountAccessEntryRow {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: formatEmployeeName(row.employee.firstName, row.employee.lastName),
    employeeEmail: row.employee.email,
    role: row.role,
    grantedByEmployeeId: row.grantedByEmployeeId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMailAccountAccessEntries(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
): Promise<MailAccountAccessEntryRow[]> {
  const rows = await prisma.mailAccountAccess.findMany({
    where: { mailAccountId },
    orderBy: { createdAt: 'asc' },
    include: { employee: { select: { firstName: true, lastName: true, email: true } } },
  });
  return rows.map(toAccessEntryRow);
}

export async function upsertMailAccountAccess(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    mailAccountId: string;
    employeeId: string;
    role: MailAccountAccessRole;
    grantedByEmployeeId: string;
  },
): Promise<void> {
  await prisma.mailAccountAccess.upsert({
    where: {
      mailAccountId_employeeId: {
        mailAccountId: params.mailAccountId,
        employeeId: params.employeeId,
      },
    },
    create: {
      mailAccountId: params.mailAccountId,
      employeeId: params.employeeId,
      role: params.role,
      grantedByEmployeeId: params.grantedByEmployeeId,
    },
    update: { role: params.role, grantedByEmployeeId: params.grantedByEmployeeId },
  });
}

export async function updateMailAccountAccessRole(
  prisma: InstanceType<typeof PrismaClient>,
  params: { mailAccountId: string; targetEmployeeId: string; role: MailAccountAccessRole },
): Promise<boolean> {
  const result = await prisma.mailAccountAccess.updateMany({
    where: { mailAccountId: params.mailAccountId, employeeId: params.targetEmployeeId },
    data: { role: params.role },
  });
  return result.count > 0;
}

/** True when the employee owns the mailbox or holds any delegated access row. */
export async function employeeHasMailAccountAccess(
  prisma: InstanceType<typeof PrismaClient>,
  mailAccountId: string,
  employeeId: string,
): Promise<boolean> {
  const account = await prisma.mailAccount.findFirst({
    where: {
      id: mailAccountId,
      OR: [{ ownerEmployeeId: employeeId }, { accesses: { some: { employeeId } } }],
    },
    select: { id: true },
  });
  return account !== null;
}

export async function removeMailAccountAccess(
  prisma: InstanceType<typeof PrismaClient>,
  params: { mailAccountId: string; targetEmployeeId: string },
): Promise<boolean> {
  const result = await prisma.mailAccountAccess.deleteMany({
    where: { mailAccountId: params.mailAccountId, employeeId: params.targetEmployeeId },
  });
  return result.count > 0;
}
