import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createPrismaClient, type PrismaClient } from '@nbos/database';
import { seedPermissionRole } from '../../../../../packages/database/prisma/seed-permission-role';
import { OrgSeatAssignmentsService } from './org-seat-assignments.service';
import { OrgSeatsService } from './org-seats.service';
import { EmployeeEffectiveAccessService } from './employee-effective-access.service';
import { EmployeeGuard } from '../../common/guards/employee.guard';
import { OrgSeatAccessPreviewService } from './org-seat-access-preview.service';
import type { CurrentUserPayload } from '../../common/decorators';
const require = createRequire(import.meta.url);
const { Client } = createRequire(require.resolve('@nbos/database'))('pg');

const databaseUrl = process.env.NBOS_SEATS_TEST_DATABASE_URL;
const migration = readFileSync(
  new URL(
    '../../../../../packages/database/prisma/migrations/20260914183000_org_seats_multi_role_access/migration.sql',
    import.meta.url,
  ),
  'utf8',
);

/** Partial unique indexes Prisma cannot express; they must survive every generated migration. */
const CONCURRENCY_INDEXES = [
  'org_seat_assignments_one_active_per_seat',
  'org_seat_assignments_one_open_primary_per_employee',
  'permission_role_assignments_one_active_legacy',
  'permission_role_assignments_one_active_manual_role',
];

// Opt-in only: this suite must never use the application's DATABASE_URL.
describe.skipIf(!databaseUrl)('Seats foundation on isolated PostgreSQL', () => {
  let prisma: PrismaClient;
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const ownership = {
    assertCanAssignRole: vi.fn().mockResolvedValue(undefined),
    assertFounderNotMutatedByOthers: vi.fn().mockResolvedValue(undefined),
  };
  let assignments: OrgSeatAssignmentsService;
  let seats: OrgSeatsService;
  let access: EmployeeEffectiveAccessService;

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.startsWith('/seats_')) {
      throw new Error('Use an isolated local seats_* database.');
    }
    prisma = createPrismaClient({ databaseUrl, skipBudgetAssert: true, skipUrlRewrite: true });
    const sql = new Client({ connectionString: databaseUrl });
    await sql.connect();
    try {
      // db push cannot express Prisma's partial indexes; use the actual migration definitions.
      for (const statement of migration.match(/CREATE UNIQUE INDEX[^;]+;/g) ?? []) {
        await sql.query(
          statement.replace('CREATE UNIQUE INDEX', 'CREATE UNIQUE INDEX IF NOT EXISTS'),
        );
      }
    } finally {
      await sql.end();
    }
    assignments = new OrgSeatAssignmentsService(prisma, audit as never, ownership as never);
    seats = new OrgSeatsService(prisma, audit as never);
    access = new EmployeeEffectiveAccessService(prisma);
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('keeps every concurrency index the migration defines', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
      `SELECT indexname FROM pg_indexes WHERE indexname = ANY($1::text[])`,
      CONCURRENCY_INDEXES,
    );
    expect(rows.map((row) => row.indexname).sort()).toEqual([...CONCURRENCY_INDEXES].sort());
  });

  async function fixture() {
    const role = await prisma.role.create({
      data: { name: 'Test role', slug: randomUUID(), level: 999 },
    });
    const employee = await prisma.employee.create({
      data: {
        email: `${randomUUID()}@test.invalid`,
        firstName: 'Seat',
        lastName: 'Test',
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    const department = await prisma.department.create({
      data: { name: 'Test department', slug: randomUUID() },
    });
    const actor: CurrentUserPayload = {
      id: employee.id,
      firstName: 'Seat',
      lastName: 'Test',
      email: employee.email,
      role: 'ceo',
      roleLevel: 999,
      departmentIds: [],
      permissions: { COMPANY_EDIT: 'ALL', SETTINGS_RBAC_EDIT: 'ALL' },
    };
    const makeSeat = () =>
      seats.create(
        {
          departmentId: department.id,
          title: 'Explicit function',
          defaultPermissionRoleId: role.id,
        },
        actor,
      );
    return { role, employee, department, actor, makeSeat };
  }

  async function readUser(employeeId: string) {
    const guard = new EmployeeGuard(
      prisma,
      { getAllAndOverride: () => false } as never,
      { isPlatformOwner: async () => false } as never,
    );
    const request = { user: { employeeId } };
    await guard.canActivate({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => request }),
    } as never);
    return request.user as unknown as CurrentUserPayload;
  }

  it('preserves legacy department access, isolates seat grants, and expires cached grants', async () => {
    const f = await fixture();
    const other = await fixture();
    for (const [action, roleId] of [
      ['VIEW', other.role.id],
      ['EDIT', f.role.id],
    ] as const) {
      const permission = await prisma.permission.upsert({
        where: { module_action: { module: 'SEAT_TEST', action } },
        create: { module: 'SEAT_TEST', action },
        update: {},
      });
      await prisma.rolePermission.create({
        data: { roleId, permissionId: permission.id, scope: 'DEPARTMENT' },
      });
    }
    await prisma.employeeDepartment.createMany({
      data: [
        { employeeId: f.employee.id, departmentId: f.department.id, isPrimary: true },
        { employeeId: f.employee.id, departmentId: other.department.id },
      ],
    });
    const before = await readUser(f.employee.id);
    expect(before.permissionGrants?.SEAT_TEST_EDIT.departmentIds).toEqual(
      expect.arrayContaining([f.department.id, other.department.id]),
    );
    const seat = await other.makeSeat();
    const preview = await new OrgSeatAccessPreviewService(prisma).preview(seat!.id, {
      employeeId: f.employee.id,
      operation: 'ASSIGN',
    });
    const assignment = await assignments.assign(seat!.id, { employeeId: f.employee.id }, f.actor);
    const after = await readUser(f.employee.id);
    expect(after.permissionGrants).toEqual(preview.after);
    expect(after.permissionGrants?.SEAT_TEST_VIEW.departmentIds).toEqual([other.department.id]);
    expect(after.role).toBe(before.role);
    await prisma.permissionRoleAssignment.updateMany({
      where: { seatAssignmentId: assignment.id },
      data: { effectiveFrom: new Date('2026-01-01'), effectiveTo: new Date('2026-01-02') },
    });
    const expired = await readUser(f.employee.id);
    expect(expired.permissionGrants?.SEAT_TEST_VIEW).toBeUndefined();
    expect(expired.permissionGrants?.SEAT_TEST_EDIT).toEqual(
      before.permissionGrants?.SEAT_TEST_EDIT,
    );
  });

  it.each([false, true])(
    'restores primary membership after a chain of seats (same department=%s)',
    async (same) => {
      const f = await fixture();
      const previous = await fixture();
      const third = await fixture();
      await prisma.employeeDepartment.create({
        data: { employeeId: f.employee.id, departmentId: previous.department.id, isPrimary: true },
      });
      const first = await assignments.assign(
        (await f.makeSeat())!.id,
        { employeeId: f.employee.id, isPrimary: true },
        f.actor,
      );
      const second = await assignments.assign(
        (await (same ? f : third).makeSeat())!.id,
        { employeeId: f.employee.id, isPrimary: true },
        f.actor,
      );
      await assignments.end(first.id, f.actor);
      await assignments.end(second.id, f.actor);
      const memberships = await prisma.employeeDepartment.findMany({
        where: { employeeId: f.employee.id },
      });
      expect(
        memberships.map((row) => ({ departmentId: row.departmentId, isPrimary: row.isPrimary })),
      ).toEqual([{ departmentId: previous.department.id, isPrimary: true }]);
    },
  );

  it('applies the migration without inferring seats or changing legacy data', async () => {
    const sql = new Client({ connectionString: databaseUrl });
    await sql.connect();
    try {
      await sql.query('BEGIN');
      const schema = `seat_fixture_${randomUUID().replaceAll('-', '')}`;
      await sql.query(`CREATE SCHEMA "${schema}"; SET LOCAL search_path TO "${schema}"`);
      await sql.query(`
        CREATE TABLE roles (id TEXT PRIMARY KEY);
        CREATE TABLE departments (id TEXT PRIMARY KEY, parent_id TEXT, slug TEXT);
        CREATE TABLE employees (id TEXT PRIMARY KEY, role_id TEXT REFERENCES roles(id),
          status TEXT, created_at TIMESTAMP NOT NULL, fire_date TIMESTAMP);
        CREATE TABLE employee_departments (employee_id TEXT, department_id TEXT, dept_role TEXT);
        INSERT INTO roles VALUES ('r');
        INSERT INTO departments VALUES ('sales', NULL, 'sales'), ('finance', NULL, 'finance');
        INSERT INTO employees VALUES
          ('active', 'r', 'ACTIVE', '2026-01-02', NULL),
          ('terminated', 'r', 'TERMINATED', '2026-01-02', '2025-01-01');
        INSERT INTO employee_departments VALUES ('active', 'sales', 'HEAD'), ('active', 'finance', 'MEMBER');
      `);
      const before = await sql.query('SELECT * FROM departments ORDER BY id');
      await sql.query(migration);
      expect((await sql.query('SELECT * FROM org_seats')).rowCount).toBe(0);
      expect((await sql.query('SELECT * FROM org_seat_assignments')).rowCount).toBe(0);
      expect(
        (await sql.query('SELECT id, parent_id, slug FROM departments ORDER BY id')).rows,
      ).toEqual(before.rows);
      expect((await sql.query('SELECT * FROM employee_departments')).rowCount).toBe(2);
      const grants = (
        await sql.query('SELECT * FROM permission_role_assignments ORDER BY employee_id')
      ).rows;
      expect(grants).toHaveLength(2);
      expect(grants[0].revoked_at).toBeNull();
      expect(grants[1].revoked_at).not.toBeNull();
      expect(grants[1].effective_to.getTime()).toBeGreaterThanOrEqual(
        grants[1].effective_from.getTime(),
      );
    } finally {
      await sql.query('ROLLBACK');
      await sql.end();
    }
  });

  it.each([false, true])(
    'cleans provisioned membership in either end order (reverse=%s)',
    async (reverse) => {
      const f = await fixture();
      const first = await assignments.assign(
        (await f.makeSeat())!.id,
        { employeeId: f.employee.id },
        f.actor,
      );
      const second = await assignments.assign(
        (await f.makeSeat())!.id,
        { employeeId: f.employee.id },
        f.actor,
      );
      const order = reverse ? [second, first] : [first, second];
      await assignments.end(order[0].id, f.actor);
      expect(await prisma.employeeDepartment.count({ where: { employeeId: f.employee.id } })).toBe(
        1,
      );
      expect(
        (await access.get(f.employee.id)).roles.filter((r) => r.source === 'SEAT'),
      ).toHaveLength(1);
      await assignments.end(order[1].id, f.actor);
      expect(await prisma.employeeDepartment.count({ where: { employeeId: f.employee.id } })).toBe(
        0,
      );
      expect((await access.get(f.employee.id)).roles.map((r) => r.source)).toEqual(['LEGACY']);
      expect(
        await prisma.orgSeatAssignment.count({
          where: { employeeId: f.employee.id, status: 'ENDED' },
        }),
      ).toBe(2);
    },
  );

  it('preserves an existing membership, deptRole and primary flag', async () => {
    const f = await fixture();
    await prisma.employeeDepartment.create({
      data: {
        employeeId: f.employee.id,
        departmentId: f.department.id,
        deptRole: 'HEAD',
        isPrimary: true,
      },
    });
    const assignment = await assignments.assign(
      (await f.makeSeat())!.id,
      { employeeId: f.employee.id, isPrimary: true },
      f.actor,
    );
    await assignments.end(assignment.id, f.actor);
    const member = await prisma.employeeDepartment.findFirstOrThrow({
      where: { employeeId: f.employee.id },
    });
    expect(member).toMatchObject({ deptRole: 'HEAD', isPrimary: true });
  });

  it('allows only one winner for concurrent assignments to one seat', async () => {
    const f = await fixture();
    const other = await fixture();
    const seat = await f.makeSeat();
    const results = await Promise.allSettled([
      assignments.assign(seat!.id, { employeeId: f.employee.id }, f.actor),
      assignments.assign(seat!.id, { employeeId: other.employee.id }, f.actor),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      await prisma.orgSeatAssignment.count({ where: { seatId: seat!.id, status: 'ACTIVE' } }),
    ).toBe(1);
  });

  it('archives only vacant seats and retains history', async () => {
    const f = await fixture();
    const seat = await f.makeSeat();
    const assignment = await assignments.assign(seat!.id, { employeeId: f.employee.id }, f.actor);
    await expect(seats.archive(seat!.id, f.actor)).rejects.toThrow('End the active');
    await assignments.end(assignment.id, f.actor);
    await seats.archive(seat!.id, f.actor);
    expect(await prisma.orgSeatAssignment.count({ where: { seatId: seat!.id } })).toBe(1);
    await expect(
      assignments.assign(seat!.id, { employeeId: f.employee.id }, f.actor),
    ).rejects.toThrow('Active org seat');
  });

  it('requires RBAC edit to remove a mapping too', async () => {
    const f = await fixture();
    const seat = await f.makeSeat();
    await expect(
      seats.update(
        seat!.id,
        { defaultPermissionRoleId: null },
        { ...f.actor, permissions: { COMPANY_EDIT: 'ALL' } },
      ),
    ).rejects.toThrow('SETTINGS_RBAC');
  });

  it('seeding preserves revoked history and is repeatable after a role change', async () => {
    const f = await fixture();
    await seedPermissionRole(prisma, f.employee.id);
    const old = await prisma.permissionRoleAssignment.findFirstOrThrow({
      where: { employeeId: f.employee.id },
    });
    await prisma.permissionRoleAssignment.update({
      where: { id: old.id },
      data: { revokedAt: new Date(), effectiveTo: new Date() },
    });
    await seedPermissionRole(prisma, f.employee.id);
    await seedPermissionRole(prisma, f.employee.id);
    expect(
      await prisma.permissionRoleAssignment.count({
        where: { employeeId: f.employee.id, revokedAt: null },
      }),
    ).toBe(1);
    expect(
      await prisma.permissionRoleAssignment.count({ where: { employeeId: f.employee.id } }),
    ).toBe(2);
    expect(
      (await prisma.permissionRoleAssignment.findUniqueOrThrow({ where: { id: old.id } }))
        .revokedAt,
    ).not.toBeNull();
  });

  it('does not expose any effective access for a terminated employee', async () => {
    const f = await fixture();
    await prisma.employee.update({ where: { id: f.employee.id }, data: { status: 'TERMINATED' } });
    await seedPermissionRole(prisma, f.employee.id);
    expect((await access.get(f.employee.id)).effectivePermissions).toEqual({});
    expect(
      await prisma.permissionRoleAssignment.count({
        where: { employeeId: f.employee.id, revokedAt: null },
      }),
    ).toBe(0);
    await expect(
      assignments.assign((await f.makeSeat())!.id, { employeeId: f.employee.id }, f.actor),
    ).rejects.toThrow('active employee');
  });
});
