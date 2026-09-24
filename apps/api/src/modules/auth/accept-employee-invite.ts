import { BadRequestException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { assertInvitationRoleStillAssignable } from './auth-invite-role';
import { isOpenInviteEmail, normalizeInviteEmail } from '../invitations/invitation-link';

const ALREADY_REGISTERED = 'An account with this email already exists';
const EMAIL_REQUIRED = 'Email is required';

interface PendingInvitation {
  id: string;
  email: string;
  roleId: string;
  departmentId: string | null;
  invitedById: string;
  employeeId: string | null;
}

interface RegistrationInput {
  invitation: PendingInvitation;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}

export async function acceptEmployeeInvite(params: {
  prisma: InstanceType<typeof PrismaClient>;
  founderEmployeeIdEnv: string | null;
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  email?: string;
}): Promise<{ id: string; email: string }> {
  const invitation = await loadPendingInvitation(params.prisma, params.token);
  await assertInvitationRoleStillAssignable(params.prisma, {
    invitedById: invitation.invitedById,
    roleId: invitation.roleId,
    founderEmployeeIdEnv: params.founderEmployeeIdEnv,
  });
  const email = resolveRegistrationEmail(invitation.email, params.email);
  await assertOpenEmailFree(params.prisma, invitation, email);
  const passwordHash = await argon2.hash(params.password, { type: argon2.argon2id });
  return params.prisma.$transaction((tx) =>
    commitRegistration(tx, {
      invitation,
      email,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      passwordHash,
    }),
  );
}

async function loadPendingInvitation(
  prisma: InstanceType<typeof PrismaClient>,
  token: string,
): Promise<PendingInvitation> {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new BadRequestException('Invalid invitation token');
  if (invitation.status !== 'PENDING') {
    throw new BadRequestException('Invitation has already been used or cancelled');
  }
  if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation has expired');
  return invitation;
}

function resolveRegistrationEmail(invitationEmail: string, submitted?: string): string {
  if (!isOpenInviteEmail(invitationEmail)) return normalizeInviteEmail(invitationEmail);
  const email = submitted ? normalizeInviteEmail(submitted) : '';
  if (!email || isOpenInviteEmail(email)) throw new BadRequestException(EMAIL_REQUIRED);
  return email;
}

async function assertOpenEmailFree(
  prisma: InstanceType<typeof PrismaClient>,
  invitation: PendingInvitation,
  email: string,
): Promise<void> {
  if (!isOpenInviteEmail(invitation.email)) return;
  const [employee, otherInvite] = await Promise.all([
    prisma.employee.findUnique({ where: { email }, select: { id: true } }),
    prisma.invitation.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (employee) throw new ConflictException(ALREADY_REGISTERED);
  if (otherInvite && otherInvite.id !== invitation.id) {
    throw new ConflictException('Invitation for this email already exists');
  }
}

async function commitRegistration(
  tx: TransactionClient,
  input: RegistrationInput,
): Promise<{ id: string; email: string }> {
  const existing = await findPasswordlessEmployee(tx, input.invitation, input.email);
  const employee = existing
    ? await activateExistingEmployee(tx, existing.id, input)
    : await createInvitedEmployee(tx, input);
  await ensureLegacyRole(tx, employee.id, input.invitation);
  await ensureDepartment(tx, employee.id, input.invitation.departmentId);
  await tx.invitation.update({
    where: { id: input.invitation.id },
    data: { status: 'ACCEPTED', employeeId: employee.id, email: input.email },
  });
  return employee;
}

async function findPasswordlessEmployee(
  tx: TransactionClient,
  invitation: PendingInvitation,
  email: string,
): Promise<{ id: string } | null> {
  const row = invitation.employeeId
    ? await tx.employee.findUnique({
        where: { id: invitation.employeeId },
        select: { id: true, email: true, passwordHash: true, status: true },
      })
    : await tx.employee.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true, status: true },
      });
  if (!row) {
    if (invitation.employeeId) throw new BadRequestException('Invalid invitation token');
    return null;
  }
  if (normalizeInviteEmail(row.email) !== email) {
    throw new BadRequestException('Invalid invitation token');
  }
  if (row.status === 'TERMINATED') throw new BadRequestException('Account deactivated');
  if (row.passwordHash) throw new ConflictException(ALREADY_REGISTERED);
  return { id: row.id };
}

async function activateExistingEmployee(
  tx: TransactionClient,
  employeeId: string,
  input: RegistrationInput,
): Promise<{ id: string; email: string }> {
  return tx.employee.update({
    where: { id: employeeId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
    },
    select: { id: true, email: true },
  });
}

async function createInvitedEmployee(
  tx: TransactionClient,
  input: RegistrationInput,
): Promise<{ id: string; email: string }> {
  return tx.employee.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
      roleId: input.invitation.roleId,
    },
    select: { id: true, email: true },
  });
}

async function ensureLegacyRole(
  tx: TransactionClient,
  employeeId: string,
  invitation: PendingInvitation,
): Promise<void> {
  const active = await tx.permissionRoleAssignment.findFirst({
    where: { employeeId, source: 'LEGACY', revokedAt: null },
    select: { id: true },
  });
  if (active) return;
  await tx.permissionRoleAssignment.create({
    data: {
      employeeId,
      roleId: invitation.roleId,
      source: 'LEGACY',
      isPrimary: true,
      assignedById: invitation.invitedById,
      reason: 'Initial role from accepted invitation',
    },
  });
}

async function ensureDepartment(
  tx: TransactionClient,
  employeeId: string,
  departmentId: string | null,
): Promise<void> {
  if (!departmentId) return;
  const existing = await tx.employeeDepartment.findUnique({
    where: { employeeId_departmentId: { employeeId, departmentId } },
    select: { id: true },
  });
  if (existing) return;
  await tx.employeeDepartment.create({
    data: { employeeId, departmentId, isPrimary: true },
  });
}
