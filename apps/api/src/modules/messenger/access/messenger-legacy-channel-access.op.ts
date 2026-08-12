import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../../platform-access/platform-team-graph.where';

/** RBAC scopes used by MESSENGER_* permissions (seed-rbac). */
export type MessengerRbacScope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';

export type MessengerLegacyAccessContext = {
  employeeId: string;
  departmentIds: string[];
  viewScope: MessengerRbacScope;
  editScope: MessengerRbacScope;
  driveViewScope?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeMessengerRbacScope(raw: string | null | undefined): MessengerRbacScope {
  const s = raw?.trim().toUpperCase();
  if (s === 'ALL' || s === 'OWN' || s === 'DEPARTMENT' || s === 'NONE') return s;
  return 'NONE';
}

export function messengerViewBypassesChannelFilter(scope: MessengerRbacScope): boolean {
  return scope === 'ALL';
}

export function isMessengerProjectUuid(projectId: string): boolean {
  return UUID_RE.test(projectId.trim());
}

/** Org-wide channel types visible to any employee with MESSENGER VIEW (non-NONE). */
export function isOrgWideMessengerChannelType(type: string): boolean {
  return type === 'GENERAL' || type === 'ANNOUNCEMENT';
}

export async function loadMessengerLegacyAccess(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<MessengerLegacyAccessContext | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      status: true,
      departments: { select: { departmentId: true } },
      role: {
        select: {
          permissions: {
            select: {
              scope: true,
              permission: { select: { module: true, action: true } },
            },
          },
        },
      },
    },
  });
  if (!employee || employee.status === 'TERMINATED') return null;

  const permissions: Record<string, string> = {};
  for (const rp of employee.role.permissions) {
    permissions[`${rp.permission.module}_${rp.permission.action}`] = rp.scope;
  }

  return {
    employeeId: employee.id,
    departmentIds: employee.departments.map((d) => d.departmentId),
    viewScope: normalizeMessengerRbacScope(permissions.MESSENGER_VIEW),
    editScope: normalizeMessengerRbacScope(permissions.MESSENGER_EDIT),
    driveViewScope: permissions.DRIVE_VIEW,
  };
}

export async function loadMessengerScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerLegacyAccessContext,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  if (access.viewScope !== 'DEPARTMENT' || access.departmentIds.length === 0) {
    return [...ids];
  }
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return [...ids];
}

type ChannelAccessRow = {
  id: string;
  projectId: string;
  type: string;
};

/**
 * Legacy Internal Messenger channel ACL (Phase 4).
 * - ALL: every channel
 * - OWN/DEPARTMENT: GENERAL/ANNOUNCEMENT; PROJECT with real Project UUID via team graph;
 *   PROJECT with legacy non-UUID logical keys (seed) remain visible to anyone with VIEW
 * - NONE: deny
 */
export async function canAccessMessengerChannel(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerLegacyAccessContext,
  channel: ChannelAccessRow,
): Promise<boolean> {
  if (access.viewScope === 'NONE') return false;
  if (messengerViewBypassesChannelFilter(access.viewScope)) return true;
  if (isOrgWideMessengerChannelType(channel.type)) return true;

  if (channel.type === 'PROJECT' && isMessengerProjectUuid(channel.projectId)) {
    const scopedIds = await loadMessengerScopedEmployeeIds(prisma, access);
    const row = await prisma.project.findFirst({
      where: { id: channel.projectId, ...buildProjectParticipationWhere(scopedIds) },
      select: { id: true },
    });
    return Boolean(row);
  }

  // Transitional: seed/legacy logical project keys (e.g. "system", "nbos") with no Project FK.
  return channel.type === 'PROJECT';
}

export async function assertCanAccessMessengerChannel(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerLegacyAccessContext,
  channelId: string,
): Promise<ChannelAccessRow> {
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    select: { id: true, projectId: true, type: true },
  });
  if (!channel || !(await canAccessMessengerChannel(prisma, access, channel))) {
    throw new NotFoundException('Channel not found');
  }
  return channel;
}
