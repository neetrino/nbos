import type { PrismaClient } from '@nbos/database';
import type { DomainConnectionMode } from '@nbos/shared';
import type { ClientServiceFlowsService } from '../client-service-flows.service';
import {
  CLIENT_SERVICE_OPEN_TASK_STATUSES,
  CLIENT_SERVICE_TASK_ENTITY_TYPE,
} from '../client-service-flow-helpers';

export const DOMAIN_PREP_MARKERS = {
  PURCHASE: 'NBOS domainPrep=PURCHASE',
  EXISTING_ACCESS: 'NBOS domainPrep=ACCESS',
  CLIENT_DNS: 'NBOS domainPrep=DNS',
} as const;

type PrismaDb = Pick<PrismaClient, 'task' | 'clientServiceRecord'>;

export async function ensureDomainProcessTask(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  params: {
    productId: string;
    connectionMode: DomainConnectionMode;
    serviceIds: readonly string[];
    actorEmployeeId: string;
    techEmployeeId?: string | null;
  },
): Promise<string | null> {
  if (params.serviceIds.length === 0) return null;
  const marker = DOMAIN_PREP_MARKERS[params.connectionMode];
  if (params.connectionMode === 'PURCHASE') {
    const needsPrep = await prisma.clientServiceRecord.findMany({
      where: { id: { in: [...params.serviceIds] }, providerAccountId: null },
      select: { id: true },
    });
    if (needsPrep.length === 0) return null;
  }

  const existing = await prisma.task.findFirst({
    where: {
      status: { in: [...CLIENT_SERVICE_OPEN_TASK_STATUSES] },
      description: { contains: marker },
      links: {
        some: {
          entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
          entityId: { in: [...params.serviceIds] },
        },
      },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const services = await prisma.clientServiceRecord.findMany({
    where: { id: { in: [...params.serviceIds] } },
    select: { id: true, name: true },
  });
  const domains = services.map((row) => row.name).join(', ');
  const first = services[0];
  if (!first) return null;

  const task = await flows.createTask(first.id, {
    creatorId: params.actorEmployeeId,
    title: domainProcessTaskTitle(params.connectionMode, domains),
    description: `${domainProcessTaskDescription(params.connectionMode, domains)}\n${marker}`,
    priority: 'HIGH',
    extraLinks: services.slice(1).map((row) => ({
      entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
      entityId: row.id,
    })),
    productId: params.productId,
    assigneeId: params.techEmployeeId ?? undefined,
  });
  return task.id;
}

export function domainProcessTaskTitle(mode: DomainConnectionMode, domains: string): string {
  if (mode === 'EXISTING_ACCESS') {
    return `Verify login and connect the listed domains to our Cloudflare: ${domains}`;
  }
  if (mode === 'CLIENT_DNS') {
    return `Prepare Cloudflare connection and send assigned nameservers: ${domains}`;
  }
  return `Prepare the registrar account for ${domains}`;
}

function domainProcessTaskDescription(mode: DomainConnectionMode, domains: string): string {
  if (mode === 'CLIENT_DNS') {
    return `Prepare Cloudflare for ${domains} and record the assigned nameservers per domain in this task. Confirm that the client received them.`;
  }
  if (mode === 'EXISTING_ACCESS') {
    return `Verify login and connect ${domains} to our Cloudflare.`;
  }
  return `Create or reuse the registrar account and save the credential on the linked domain services: ${domains}.`;
}

export function hasCompletedDomainDnsHandoff(
  tasks: ReadonlyArray<{ status: string; description: string | null }>,
): boolean {
  return tasks.some(
    (task) =>
      task.status === 'COMPLETED' &&
      Boolean(task.description?.includes(DOMAIN_PREP_MARKERS.CLIENT_DNS)),
  );
}
