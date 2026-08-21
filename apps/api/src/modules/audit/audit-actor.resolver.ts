import { ACTOR_TYPE_DISPLAY_NAME, isEmployeeActorType, type ActorType } from '@nbos/shared';
import type { PrismaClient, Prisma } from '@nbos/database';
import { resolveHistoricalAuditActor } from './audit-historical-actor';

type AuditLogRow = Prisma.AuditLogModel;

export interface AuditActorSummary {
  id: string;
  type: ActorType;
  displayName: string;
  firstName: string;
  lastName: string;
}

export type AuditLogWithActor = AuditLogRow & { actor: AuditActorSummary | null };

export type MachineActorDisplayLookup = (id: string) => Promise<string | null>;

export interface AuditActorLookups {
  resolveExternalAgentDisplayName?: MachineActorDisplayLookup;
  resolveInternalAiDisplayName?: MachineActorDisplayLookup;
}

interface EmployeeNameRow {
  id: string;
  firstName: string;
  lastName: string;
}

function employeeSummary(employee: EmployeeNameRow): AuditActorSummary {
  const displayName = `${employee.firstName} ${employee.lastName}`.trim();
  return {
    id: employee.id,
    type: 'USER',
    displayName,
    firstName: employee.firstName,
    lastName: employee.lastName,
  };
}

function machineSummary(type: ActorType, id: string, displayName: string): AuditActorSummary {
  return { id, type, displayName, firstName: displayName, lastName: '' };
}

async function resolveMachineDisplayName(
  type: ActorType,
  id: string,
  lookups: AuditActorLookups,
): Promise<string> {
  if (type === 'EXTERNAL_AGENT') {
    return (await lookups.resolveExternalAgentDisplayName?.(id)) ?? ACTOR_TYPE_DISPLAY_NAME[type];
  }
  if (type === 'INTERNAL_AI') {
    return (await lookups.resolveInternalAiDisplayName?.(id)) ?? ACTOR_TYPE_DISPLAY_NAME[type];
  }
  return ACTOR_TYPE_DISPLAY_NAME[type];
}

async function loadEmployeesById(
  prisma: InstanceType<typeof PrismaClient>,
  ids: string[],
): Promise<Map<string, EmployeeNameRow>> {
  if (ids.length === 0) {
    return new Map();
  }
  const employees = await prisma.employee.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true },
  });
  return new Map(employees.map((employee) => [employee.id, employee]));
}

export async function attachActorsToAuditLogs(
  prisma: InstanceType<typeof PrismaClient>,
  rows: AuditLogRow[],
  lookups: AuditActorLookups = {},
): Promise<AuditLogWithActor[]> {
  const refs = rows.map((row) => resolveHistoricalAuditActor(row));
  const userIds = [
    ...new Set(refs.flatMap((ref) => (ref && isEmployeeActorType(ref.type) ? [ref.id] : []))),
  ];
  const employees = await loadEmployeesById(prisma, userIds);

  return Promise.all(
    rows.map(async (row, index) => {
      const ref = refs[index];
      if (!ref) {
        return { ...row, actor: null };
      }
      if (isEmployeeActorType(ref.type)) {
        const employee = employees.get(ref.id);
        return { ...row, actor: employee ? employeeSummary(employee) : null };
      }
      const displayName = await resolveMachineDisplayName(ref.type, ref.id, lookups);
      return { ...row, actor: machineSummary(ref.type, ref.id, displayName) };
    }),
  );
}
