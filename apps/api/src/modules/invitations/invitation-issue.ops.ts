import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@nbos/database';
import { inviteExpiresAt, openInviteEmail } from './invitation-link';

const ISSUED_SELECT = {
  id: true,
  token: true,
  email: true,
  expiresAt: true,
  invitedById: true,
} as const;

export interface IssuedInvitation {
  id: string;
  token: string;
  email: string;
  expiresAt: Date;
  invitedById: string;
}

type Prisma = InstanceType<typeof PrismaClient>;

export async function createOpenInvitation(
  prisma: Prisma,
  input: { roleId: string; invitedById: string },
): Promise<IssuedInvitation> {
  const id = randomUUID();
  const expiresAt = inviteExpiresAt();
  return prisma.invitation.create({
    data: {
      id,
      email: openInviteEmail(id),
      roleId: input.roleId,
      invitedById: input.invitedById,
      status: 'PENDING',
      token: randomUUID(),
      expiresAt,
    },
    select: ISSUED_SELECT,
  });
}

export async function renewEmailInvitation(
  prisma: Prisma,
  input: {
    email: string;
    roleId: string;
    invitedById: string;
    employeeId: string | null;
    departmentId?: string | null;
  },
): Promise<IssuedInvitation> {
  const existing = await prisma.invitation.findUnique({ where: { email: input.email } });
  const expiresAt = inviteExpiresAt();
  const keepToken = existing?.status === 'PENDING' && existing.expiresAt > new Date();
  const token = keepToken && existing ? existing.token : randomUUID();
  const data = {
    roleId: input.roleId,
    invitedById: input.invitedById,
    employeeId: input.employeeId,
    status: 'PENDING',
    token,
    expiresAt,
    ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
  };
  if (!existing) {
    return prisma.invitation.create({
      data: { ...data, email: input.email },
      select: ISSUED_SELECT,
    });
  }
  return prisma.invitation.update({
    where: { id: existing.id },
    data,
    select: ISSUED_SELECT,
  });
}
