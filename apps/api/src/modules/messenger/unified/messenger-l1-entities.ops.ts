import type { Prisma, PrismaClient } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../../platform-access/platform-team-graph.where';
import type { MessengerAccessContext } from '../access/messenger-access.types';
import { messengerViewBypassesRowFilter } from '../access/messenger-access.types';
import { loadMessengerScopedEmployeeIds } from '../access/messenger-legacy-channel-access.op';
import { buildMessengerCanonicalKey } from '../access/messenger-canonical.util';
import { countConversationUnreadForEmployee } from './messenger-conversation-read.ops';
import {
  MESSENGER_L1_PAGE_SIZE,
  type MessengerInternalTab,
  type MessengerL1EntityDto,
} from './messenger-unified.types';

async function scopedIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
): Promise<string[]> {
  return loadMessengerScopedEmployeeIds(prisma, {
    employeeId: access.employeeId,
    departmentIds: access.departmentIds,
    viewScope: access.viewScope,
    editScope: access.editScope,
    driveViewScope: access.driveViewScope,
  });
}

async function unreadForCanonical(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  type: 'PROJECT_GENERAL' | 'PRODUCT' | 'DEAL' | 'TASK',
  entityId: string,
): Promise<{ unreadCount: number; conversationId: string | null }> {
  const canonicalKey = buildMessengerCanonicalKey(type, entityId);
  const conv = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: { id: true },
  });
  if (!conv) return { unreadCount: 0, conversationId: null };
  const unreadCount = await countConversationUnreadForEmployee(prisma, conv.id, employeeId);
  return { unreadCount, conversationId: conv.id };
}

export async function listMessengerL1Entities(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  tab: MessengerInternalTab,
  search?: string,
): Promise<MessengerL1EntityDto[]> {
  const q = search?.trim() ?? '';
  switch (tab) {
    case 'project':
    case 'all':
      return listProjectEntities(prisma, access, q, tab === 'all');
    case 'deal':
      return listDealEntities(prisma, access, q);
    case 'dev':
      return listProductEntities(prisma, access, q);
    case 'tasks':
      return listTaskEntities(prisma, access, q);
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

async function listProjectEntities(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  search: string,
  includeDirectBucket: boolean,
): Promise<MessengerL1EntityDto[]> {
  const bypass = messengerViewBypassesRowFilter(access.viewScope);
  const ids = bypass ? null : await scopedIds(prisma, access);
  const where: Prisma.ProjectWhereInput = {
    trashedAt: null,
    ...(ids ? buildProjectParticipationWhere(ids) : {}),
    ...(search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }
      : {}),
  };
  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: MESSENGER_L1_PAGE_SIZE,
    select: { id: true, name: true, code: true },
  });

  const rows: MessengerL1EntityDto[] = [];
  if (includeDirectBucket) {
    rows.push({
      entityType: 'DIRECT_BUCKET',
      entityId: 'direct',
      title: 'Direct messages',
      subtitle: '1:1 conversations',
      unreadCount: 0,
      primaryConversationId: null,
    });
  }

  for (const p of projects) {
    const { unreadCount, conversationId } = await unreadForCanonical(
      prisma,
      access.employeeId,
      'PROJECT_GENERAL',
      p.id,
    );
    rows.push({
      entityType: 'PROJECT',
      entityId: p.id,
      title: p.name,
      subtitle: p.code,
      unreadCount,
      primaryConversationId: conversationId,
    });
  }
  return rows;
}

async function listDealEntities(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  search: string,
): Promise<MessengerL1EntityDto[]> {
  const bypass = messengerViewBypassesRowFilter(access.viewScope);
  const ids = bypass ? null : await scopedIds(prisma, access);
  const and: Prisma.DealWhereInput[] = [];
  if (ids) {
    and.push(buildDealParticipationWhere(ids));
  }
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ],
    });
  }
  const where: Prisma.DealWhereInput = and.length > 0 ? { AND: and } : {};
  const deals = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: MESSENGER_L1_PAGE_SIZE,
    select: { id: true, name: true, code: true, status: true },
  });

  const rows: MessengerL1EntityDto[] = [];
  for (const d of deals) {
    const { unreadCount, conversationId } = await unreadForCanonical(
      prisma,
      access.employeeId,
      'DEAL',
      d.id,
    );
    rows.push({
      entityType: 'DEAL',
      entityId: d.id,
      title: d.name?.trim() || d.code,
      subtitle: d.status,
      unreadCount,
      primaryConversationId: conversationId,
    });
  }
  return rows;
}

async function listProductEntities(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  search: string,
): Promise<MessengerL1EntityDto[]> {
  const bypass = messengerViewBypassesRowFilter(access.viewScope);
  const ids = bypass ? null : await scopedIds(prisma, access);
  const and: Prisma.ProductWhereInput[] = [];
  if (ids) {
    and.push({
      OR: [
        buildProductParticipationWhere(ids),
        { project: buildProjectParticipationWhere(ids) },
      ],
    });
  }
  if (search) {
    and.push({ name: { contains: search, mode: 'insensitive' } });
  }
  const where: Prisma.ProductWhereInput = and.length > 0 ? { AND: and } : {};
  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: MESSENGER_L1_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      status: true,
      project: { select: { name: true } },
    },
  });

  const rows: MessengerL1EntityDto[] = [];
  for (const p of products) {
    const { unreadCount, conversationId } = await unreadForCanonical(
      prisma,
      access.employeeId,
      'PRODUCT',
      p.id,
    );
    rows.push({
      entityType: 'PRODUCT',
      entityId: p.id,
      title: p.name,
      subtitle: p.project.name,
      unreadCount,
      primaryConversationId: conversationId,
    });
  }
  return rows;
}

async function listTaskEntities(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerAccessContext,
  search: string,
): Promise<MessengerL1EntityDto[]> {
  const bypass = messengerViewBypassesRowFilter(access.viewScope);
  const ids = bypass ? null : await scopedIds(prisma, access);
  const and: Prisma.TaskWhereInput[] = [
    { trashedAt: null },
    { status: { not: 'COMPLETED' } },
  ];
  if (ids) {
    and.push({
      OR: [
        { creatorId: { in: ids } },
        { assigneeId: { in: ids } },
        { reviewerId: { in: ids } },
        { coAssignees: { hasSome: ids } },
        { observers: { hasSome: ids } },
        { product: buildProductParticipationWhere(ids) },
        { product: { project: buildProjectParticipationWhere(ids) } },
      ],
    });
  }
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ],
    });
  }
  const tasks = await prisma.task.findMany({
    where: { AND: and },
    orderBy: { updatedAt: 'desc' },
    take: MESSENGER_L1_PAGE_SIZE,
    select: {
      id: true,
      title: true,
      code: true,
      status: true,
      product: { select: { name: true } },
    },
  });

  const rows: MessengerL1EntityDto[] = [];
  for (const t of tasks) {
    const { unreadCount, conversationId } = await unreadForCanonical(
      prisma,
      access.employeeId,
      'TASK',
      t.id,
    );
    rows.push({
      entityType: 'TASK',
      entityId: t.id,
      title: t.title,
      subtitle: t.product?.name ?? t.code,
      unreadCount,
      primaryConversationId: conversationId,
    });
  }
  return rows;
}
