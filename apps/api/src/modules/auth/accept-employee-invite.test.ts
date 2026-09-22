import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { acceptEmployeeInvite } from './accept-employee-invite';

describe('acceptEmployeeInvite', () => {
  it('sets a password on a profile that was created without one', async () => {
    const prisma = fakePrisma({
      invitation: pendingInvite({ email: 'bia@mail.ru', employeeId: 'emp-1' }),
      employee: {
        id: 'emp-1',
        email: 'bia@mail.ru',
        passwordHash: null,
        status: 'PROBATION',
        firstName: 'Beatrice',
        lastName: 'Melikyan',
      },
    });

    const result = await acceptEmployeeInvite({
      prisma: prisma as never,
      founderEmployeeIdEnv: 'owner-1',
      token: 'tok-1',
      firstName: 'Beatrice',
      lastName: 'Melikyan',
      password: 'deskpass10',
    });

    expect(result).toEqual({ id: 'emp-1', email: 'bia@mail.ru' });
    expect(prisma.employee.update).toHaveBeenCalled();
    expect(prisma.employee.create).not.toHaveBeenCalled();
    expect(prisma.invitation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACCEPTED', employeeId: 'emp-1' }),
      }),
    );
  });

  it('refuses an email that already has a password', async () => {
    const prisma = fakePrisma({
      invitation: pendingInvite({ email: 'bia@mail.ru', employeeId: null }),
      employee: {
        id: 'emp-1',
        email: 'bia@mail.ru',
        passwordHash: 'hash',
        status: 'ACTIVE',
        firstName: 'Beatrice',
        lastName: 'Melikyan',
      },
    });

    await expect(
      acceptEmployeeInvite({
        prisma: prisma as never,
        founderEmployeeIdEnv: 'owner-1',
        token: 'tok-1',
        firstName: 'Beatrice',
        lastName: 'Melikyan',
        password: 'deskpass10',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function pendingInvite(input: { email: string; employeeId: string | null }) {
  return {
    id: 'inv-1',
    email: input.email,
    roleId: 'role-1',
    departmentId: null,
    invitedById: 'owner-1',
    employeeId: input.employeeId,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 86_400_000),
  };
}

function fakePrisma(state: {
  invitation: ReturnType<typeof pendingInvite>;
  employee: {
    id: string;
    email: string;
    passwordHash: string | null;
    status: string;
    firstName: string;
    lastName: string;
  };
}) {
  const prisma = {
    invitation: {
      findUnique: vi.fn(async () => state.invitation),
      update: vi.fn(async () => state.invitation),
    },
    employee: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === 'owner-1') {
          return { id: 'owner-1', status: 'ACTIVE', role: { slug: 'owner' } };
        }
        if (where.id === state.employee.id || where.email === state.employee.email) {
          return state.employee;
        }
        return null;
      }),
      update: vi.fn(async () => ({
        id: state.employee.id,
        email: state.employee.email,
      })),
      create: vi.fn(async () => ({ id: 'new', email: state.employee.email })),
    },
    role: { findUnique: async () => ({ slug: 'seller', assignable: true }) },
    platformOwnership: { findUnique: async () => ({ ownerEmployeeId: 'owner-1' }) },
    permissionRoleAssignment: {
      findFirst: async () => ({ id: 'grant-1' }),
      create: async () => ({ id: 'grant-2' }),
    },
    employeeDepartment: { findUnique: async () => null, create: async () => ({ id: 'dept' }) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };
  return prisma;
}
