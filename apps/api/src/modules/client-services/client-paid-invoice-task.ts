import type { PrismaClient } from '@nbos/database';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import {
  CLIENT_SERVICE_OPEN_TASK_STATUSES,
  CLIENT_SERVICE_TASK_ENTITY_TYPE,
  formatClientServiceTaskDescription,
  clientServiceTaskTitle,
} from './client-service-flow-helpers';

type PrismaDb = Pick<PrismaClient, 'task'>;

export function shouldCreateDomainPrepTask(service: {
  type: string;
  connectionMode: string | null;
  providerAccountId: string | null;
}): boolean {
  if (service.type !== 'DOMAIN') return true;
  if (service.connectionMode === 'CLIENT_DNS') return false;
  if (service.providerAccountId) return false;
  return service.connectionMode === 'PURCHASE' || service.connectionMode === null;
}

export async function ensurePrepTaskForPaidInvoice(
  prisma: PrismaDb,
  flows: ClientServiceFlowsService,
  params: {
    service: {
      id: string;
      type: 'DOMAIN' | 'HOSTING' | 'SERVICE' | 'ACCOUNT' | 'LICENSE';
      name: string;
      provider: string | null;
      connectionMode: string | null;
      providerAccountId: string | null;
      renewalDate: Date | null;
    };
    invoiceId: string;
    actorEmployeeId: string;
  },
): Promise<string | null> {
  if (!shouldCreateDomainPrepTask(params.service)) return null;

  const openTask = await prisma.task.findFirst({
    where: {
      status: { in: [...CLIENT_SERVICE_OPEN_TASK_STATUSES] },
      links: {
        some: {
          entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
          entityId: params.service.id,
        },
      },
    },
    select: { id: true },
  });
  if (openTask) return null;

  const task = await flows.createTask(params.service.id, {
    creatorId: params.actorEmployeeId,
    title: clientServiceTaskTitle(params.service.name, params.service.type),
    description: formatClientServiceTaskDescription(params.service, params.invoiceId),
    dueDate: params.service.renewalDate?.toISOString() ?? undefined,
    priority: 'HIGH',
  });
  return task.id;
}
