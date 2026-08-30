import { PrismaClient } from '@nbos/database';
import {
  isMessengerProjectUuid,
  isOrgWideMessengerChannelType,
  normalizeMessengerRbacScope,
} from '../access/messenger-legacy-channel-access.op';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MappedChannelParticipantSeed = {
  employeeId: string;
  role: 'MEMBER' | 'READ_ONLY';
};

export type MappedChannelSource = {
  type: string;
  projectId: string;
  messages?: Array<{ senderId: string }>;
};

type EmployeeMessengerScopeRow = {
  id: string;
  role: {
    permissions: Array<{ scope: string; permission: { action: string } }>;
  };
};

export async function resolveMappedChannelParticipants(
  prisma: PrismaLike,
  channel: MappedChannelSource,
): Promise<MappedChannelParticipantSeed[]> {
  const senderIds = uniqueSenderIds(channel.messages ?? []);
  const visibilityIds = await visibilityEmployeeIdsForChannel(prisma, channel);
  const rows = await loadEmployeeMessengerScopes(prisma, [
    ...new Set([...visibilityIds, ...senderIds]),
  ]);
  return rows
    .map((row) => seedFromEmployee(row, senderIds))
    .filter((seed): seed is MappedChannelParticipantSeed => seed !== null);
}

export async function backfillMappedChannelParticipants(
  prisma: PrismaLike,
  conversationId: string,
  channel: MappedChannelSource,
): Promise<void> {
  const seeds = await resolveMappedChannelParticipants(prisma, channel);
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

export async function listProjectTeamGraphEmployeeIds(
  prisma: PrismaLike,
  projectId: string,
): Promise<string[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: projectTeamGraphSelect(),
  });
  return project ? collectProjectTeamEmployeeIds(project) : [];
}

export function uniqueSenderIds(messages: Array<{ senderId: string }>): string[] {
  return [...new Set(messages.map((message) => message.senderId))];
}

export function collectProjectTeamEmployeeIds(project: {
  teamMembers: Array<{ employeeId: string }>;
  products: Array<{
    pmId: string | null;
    developerId: string | null;
    frontendDeveloperId: string | null;
    designerId: string | null;
    technicalSpecialistId: string | null;
    qaLeadId: string | null;
    teamMembers: Array<{ employeeId: string }>;
  }>;
  extensions: Array<{ assignedTo: string | null }>;
  orders: Array<{
    deal: { sellerId: string | null; sellerAssistantId: string | null; pmId: string | null } | null;
  }>;
}): string[] {
  const ids = new Set<string>();
  for (const member of project.teamMembers) ids.add(member.employeeId);
  for (const product of project.products) {
    addId(ids, product.pmId);
    addId(ids, product.developerId);
    addId(ids, product.frontendDeveloperId);
    addId(ids, product.designerId);
    addId(ids, product.technicalSpecialistId);
    addId(ids, product.qaLeadId);
    for (const member of product.teamMembers) ids.add(member.employeeId);
  }
  for (const extension of project.extensions) addId(ids, extension.assignedTo);
  for (const order of project.orders) {
    addId(ids, order.deal?.sellerId);
    addId(ids, order.deal?.sellerAssistantId);
    addId(ids, order.deal?.pmId);
  }
  return [...ids];
}

async function visibilityEmployeeIdsForChannel(
  prisma: PrismaLike,
  channel: MappedChannelSource,
): Promise<string[]> {
  if (channel.type === 'PROJECT' && isMessengerProjectUuid(channel.projectId)) {
    return listProjectTeamGraphEmployeeIds(prisma, channel.projectId);
  }
  if (isOrgWideMessengerChannelType(channel.type) || channel.type === 'PROJECT') {
    return listActiveMessengerViewEmployeeIds(prisma);
  }
  return [];
}

async function listActiveMessengerViewEmployeeIds(prisma: PrismaLike): Promise<string[]> {
  const rows = await prisma.employee.findMany({
    where: {
      status: { not: 'TERMINATED' },
      role: {
        permissions: {
          some: {
            permission: { module: 'MESSENGER', action: 'VIEW' },
            scope: { not: 'NONE' },
          },
        },
      },
    },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

async function loadEmployeeMessengerScopes(
  prisma: PrismaLike,
  employeeIds: string[],
): Promise<EmployeeMessengerScopeRow[]> {
  if (employeeIds.length === 0) return [];
  return prisma.employee.findMany({
    where: { id: { in: employeeIds }, status: { not: 'TERMINATED' } },
    select: {
      id: true,
      role: {
        select: {
          permissions: {
            where: { permission: { module: 'MESSENGER', action: { in: ['VIEW', 'EDIT'] } } },
            select: { scope: true, permission: { select: { action: true } } },
          },
        },
      },
    },
  });
}

function seedFromEmployee(
  row: EmployeeMessengerScopeRow,
  senderIds: string[],
): MappedChannelParticipantSeed | null {
  const view = permissionScope(row, 'VIEW');
  const edit = permissionScope(row, 'EDIT');
  const isSender = senderIds.includes(row.id);
  if (!isSender && view === 'NONE') return null;
  return { employeeId: row.id, role: isSender || edit !== 'NONE' ? 'MEMBER' : 'READ_ONLY' };
}

function permissionScope(
  row: EmployeeMessengerScopeRow,
  action: string,
): ReturnType<typeof normalizeMessengerRbacScope> {
  const match = row.role.permissions.find((permission) => permission.permission.action === action);
  return normalizeMessengerRbacScope(match?.scope);
}

function projectTeamGraphSelect() {
  return {
    teamMembers: { select: { employeeId: true } },
    products: {
      select: {
        pmId: true,
        developerId: true,
        frontendDeveloperId: true,
        designerId: true,
        technicalSpecialistId: true,
        qaLeadId: true,
        teamMembers: { select: { employeeId: true } },
      },
    },
    extensions: { select: { assignedTo: true } },
    orders: {
      select: {
        deal: { select: { sellerId: true, sellerAssistantId: true, pmId: true } },
      },
    },
  } as const;
}

function addId(ids: Set<string>, value: string | null | undefined): void {
  if (value) ids.add(value);
}
