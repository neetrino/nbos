import type { PrismaClient } from '@nbos/database';

type EmployeeSipDb = Pick<PrismaClient, 'employee' | 'lead' | 'deal'>;

export async function findEmployeeIdBySip(
  db: EmployeeSipDb,
  sip: string | null,
): Promise<string | null> {
  const sipId = sip?.trim() ?? '';
  if (!sipId) return null;
  const employee = await db.employee.findFirst({
    where: { sipId },
    select: { id: true },
  });
  return employee?.id ?? null;
}

export async function findResponsibleEmployeeId(
  db: EmployeeSipDb,
  input: { leadId: string | null; dealId: string | null },
): Promise<string | null> {
  if (input.leadId) {
    const lead = await db.lead.findUnique({
      where: { id: input.leadId },
      select: { assignedTo: true },
    });
    if (lead?.assignedTo) return lead.assignedTo;
  }
  if (!input.dealId) return null;
  const deal = await db.deal.findUnique({
    where: { id: input.dealId },
    select: { sellerId: true },
  });
  return deal?.sellerId ?? null;
}
