import { PrismaClient } from '@nbos/database';
import { listProjectTeamGraphEmployeeIds } from './messenger-legacy-mapper-participants.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type EntityParticipantSeed = {
  employeeId: string;
  role: 'OWNER' | 'MEMBER';
};

export async function participantSeedsForProduct(
  prisma: PrismaLike,
  productId: string,
  createdById: string,
): Promise<EntityParticipantSeed[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { projectId: true },
  });
  const teamIds = product ? await listProjectTeamGraphEmployeeIds(prisma, product.projectId) : [];
  return toSeeds(createdById, teamIds);
}

export async function participantSeedsForProject(
  prisma: PrismaLike,
  projectId: string,
  createdById: string,
): Promise<EntityParticipantSeed[]> {
  const teamIds = await listProjectTeamGraphEmployeeIds(prisma, projectId);
  return toSeeds(createdById, teamIds);
}

export async function participantSeedsForDeal(
  prisma: PrismaLike,
  dealId: string,
  createdById: string,
): Promise<EntityParticipantSeed[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { sellerId: true, sellerAssistantId: true, pmId: true, projectId: true },
  });
  if (!deal) return toSeeds(createdById, []);
  const ids = [deal.sellerId, deal.sellerAssistantId, deal.pmId];
  if (deal.projectId) {
    ids.push(...(await listProjectTeamGraphEmployeeIds(prisma, deal.projectId)));
  }
  return toSeeds(createdById, ids);
}

/** Personal marks plus opener after Task access succeeded. Do not call before access. */
export function participantSeedsForTask(
  task: {
    creatorId: string;
    assigneeId: string | null;
    reviewerId: string | null;
    coAssignees: string[];
    observers: string[];
  },
  openerEmployeeId?: string,
): EntityParticipantSeed[] {
  const createdById = openerEmployeeId ?? task.creatorId;
  return toSeeds(createdById, [
    task.creatorId,
    task.assigneeId,
    task.reviewerId,
    ...task.coAssignees,
    ...task.observers,
    openerEmployeeId,
  ]);
}

export async function backfillEntityParticipants(
  prisma: PrismaLike,
  conversationId: string,
  seeds: EntityParticipantSeed[],
): Promise<void> {
  if (seeds.length === 0) return;
  const existing = await prisma.messengerConversationParticipant.findMany({
    where: { conversationId },
    select: { employeeId: true },
  });
  const have = new Set(existing.map((row) => row.employeeId));
  const missing = seeds.filter((seed) => !have.has(seed.employeeId));
  if (missing.length === 0) return;
  await prisma.messengerConversationParticipant.createMany({
    data: missing.map((seed) => ({
      conversationId,
      employeeId: seed.employeeId,
      role: seed.role,
    })),
    skipDuplicates: true,
  });
}

function toSeeds(
  createdById: string,
  candidateIds: Array<string | null | undefined>,
): EntityParticipantSeed[] {
  const ids = new Set<string>();
  for (const id of candidateIds) {
    if (id) ids.add(id);
  }
  return [...ids].map((employeeId) => ({
    employeeId,
    role: employeeId === createdById ? 'OWNER' : 'MEMBER',
  }));
}
