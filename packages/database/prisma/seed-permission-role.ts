import type { PrismaClient } from '../src';

/** Preserve assignment history and do not resurrect a revoked deterministic row. */
export async function seedPermissionRole(prisma: PrismaClient, employeeId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM employees WHERE id = ${employeeId} FOR UPDATE`;
    const employee = await tx.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { roleId: true, status: true },
    });
    const existing = await tx.permissionRoleAssignment.findFirst({
      where: { employeeId, source: 'LEGACY', revokedAt: null },
    });
    if (existing?.roleId === employee.roleId && employee.status !== 'TERMINATED') return;
    if (existing) {
      const now = new Date(Math.max(Date.now(), existing.effectiveFrom.getTime()));
      await tx.permissionRoleAssignment.update({
        where: { id: existing.id },
        data: { revokedAt: now, effectiveTo: now },
      });
    }
    if (employee.status !== 'TERMINATED') {
      await tx.permissionRoleAssignment.create({
        data: {
          employeeId,
          roleId: employee.roleId,
          source: 'LEGACY',
          isPrimary: true,
          reason: 'Seeded primary permission role',
        },
      });
    }
    await tx.employee.update({
      where: { id: employeeId },
      data: { accessVersion: { increment: 1 } },
    });
  });
}
