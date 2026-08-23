import { ACTOR_TYPE_DISPLAY_NAME, isEmployeeActorType, type ActorType } from '@nbos/shared';
import type { PrismaClient, Prisma } from '@nbos/database';
import {
  resolveHistoricalAuditActor,
  type HistoricalAuditActorRef,
} from './audit-historical-actor';

type AuditLogRow = Prisma.AuditLogModel;

export interface AuditActorSummary {
  id: string;
  type: ActorType;
  displayName: string;
  firstName: string;
  lastName: string;
}

export type AuditLogWithActor = AuditLogRow & { actor: AuditActorSummary | null };

/** Batch display-name lookup. Resolves many ids in one query, never one per row. */
export type MachineActorDisplayLookup = (ids: string[]) => Promise<Map<string, string>>;

export interface AuditActorLookups {
  resolveExternalAgentDisplayNames?: MachineActorDisplayLookup;
  resolveInternalAiDisplayNames?: MachineActorDisplayLookup;
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

function machineNameKey(type: ActorType, id: string): string {
  return `${type}:${id}`;
}

function collectIdsByType(refs: Array<HistoricalAuditActorRef | null>, type: ActorType): string[] {
  return [...new Set(refs.flatMap((ref) => (ref?.type === type ? [ref.id] : [])))];
}

async function loadMachineDisplayNames(
  refs: Array<HistoricalAuditActorRef | null>,
  lookups: AuditActorLookups,
): Promise<Map<string, string>> {
  const resolvers: Array<[ActorType, MachineActorDisplayLookup | undefined]> = [
    ['EXTERNAL_AGENT', lookups.resolveExternalAgentDisplayNames],
    ['INTERNAL_AI', lookups.resolveInternalAiDisplayNames],
  ];
  const resolved = new Map<string, string>();
  await Promise.all(
    resolvers.map(async ([type, resolve]) => {
      if (!resolve) return;
      const ids = collectIdsByType(refs, type);
      if (ids.length === 0) return;
      const names = await resolve(ids);
      for (const [id, name] of names) {
        const trimmed = name.trim();
        if (trimmed) {
          resolved.set(machineNameKey(type, id), trimmed);
        }
      }
    }),
  );
  return resolved;
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
  const [employees, machineNames] = await Promise.all([
    loadEmployeesById(prisma, userIds),
    loadMachineDisplayNames(refs, lookups),
  ]);

  return rows.map((row, index) => {
    const ref = refs[index];
    if (!ref) {
      return { ...row, actor: null };
    }
    if (isEmployeeActorType(ref.type)) {
      const employee = employees.get(ref.id);
      return { ...row, actor: employee ? employeeSummary(employee) : null };
    }
    const displayName =
      machineNames.get(machineNameKey(ref.type, ref.id)) ?? ACTOR_TYPE_DISPLAY_NAME[ref.type];
    return { ...row, actor: machineSummary(ref.type, ref.id, displayName) };
  });
}
