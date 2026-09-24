import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  assertConfigurationAccessible,
  assertExtensionConfigurable,
  assertProductConfigurable,
  configurationAccessFromUser,
  type DeliveryConfigurationAccess,
} from './delivery-configuration-access';

const OWN: DeliveryConfigurationAccess = { employeeId: 'emp-1', departmentIds: [], scope: 'OWN' };
const ALL: DeliveryConfigurationAccess = { employeeId: 'emp-1', departmentIds: [], scope: 'ALL' };

function db(found: boolean) {
  const match = found ? { id: 'row-1' } : null;
  return {
    product: { findFirst: vi.fn().mockResolvedValue(match) },
    extension: { findFirst: vi.fn().mockResolvedValue(match) },
    deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(match) },
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe('configurationAccessFromUser', () => {
  it('reads the scope of the action the route required, not of the other one', () => {
    const user = {
      id: 'emp-1',
      departmentIds: ['dep-1'],
      permissions: { DELIVERY_CONFIGURATION_VIEW: 'ALL', DELIVERY_CONFIGURATION_EDIT: 'OWN' },
    } as unknown as CurrentUserPayload;

    expect(configurationAccessFromUser(user, 'VIEW').scope).toBe('ALL');
    expect(configurationAccessFromUser(user, 'EDIT').scope).toBe('OWN');
  });

  it('treats a missing permission as no scope rather than as company-wide', () => {
    const user = {
      id: 'emp-1',
      departmentIds: [],
      permissions: {},
    } as unknown as CurrentUserPayload;

    expect(configurationAccessFromUser(user, 'EDIT').scope).toBe('');
  });
});

describe('assertProductConfigurable', () => {
  it('lets a team member through', async () => {
    await expect(assertProductConfigurable(db(true) as never, 'p-1', OWN)).resolves.toBeUndefined();
  });

  it('hides a product the caller is not on', async () => {
    await expect(assertProductConfigurable(db(false) as never, 'p-1', OWN)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('skips the row filter for company-wide scope without querying', async () => {
    const prisma = db(false);

    await expect(assertProductConfigurable(prisma as never, 'p-1', ALL)).resolves.toBeUndefined();
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });
});

describe('assertExtensionConfigurable', () => {
  it('accepts the assignee or a member of the parent product team', async () => {
    const prisma = db(true);

    await expect(
      assertExtensionConfigurable(prisma as never, 'ext-1', OWN),
    ).resolves.toBeUndefined();
    const where = prisma.extension.findFirst.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain('assignedTo');
    expect(JSON.stringify(where)).toContain('teamMembers');
  });

  it('hides an extension outside the caller scope', async () => {
    await expect(
      assertExtensionConfigurable(db(false) as never, 'ext-1', OWN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('assertConfigurationAccessible', () => {
  it('reaches the team through either entity kind', async () => {
    const prisma = db(true);

    await expect(
      assertConfigurationAccessible(prisma as never, 'cfg-1', OWN),
    ).resolves.toBeUndefined();
    const where = prisma.deliveryConfiguration.findFirst.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
  });

  it('refuses a configuration id belonging to somebody else card', async () => {
    await expect(
      assertConfigurationAccessible(db(false) as never, 'cfg-1', OWN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('widens a DEPARTMENT scope to the colleagues of that department', async () => {
    const prisma = db(true);
    prisma.employeeDepartment.findMany.mockResolvedValue([
      { employeeId: 'emp-2' },
      { employeeId: 'emp-3' },
    ]);

    await assertConfigurationAccessible(prisma as never, 'cfg-1', {
      employeeId: 'emp-1',
      departmentIds: ['dep-1'],
      scope: 'DEPARTMENT',
    });

    const serialized = JSON.stringify(
      prisma.deliveryConfiguration.findFirst.mock.calls[0][0].where,
    );
    expect(serialized).toContain('emp-2');
    expect(serialized).toContain('emp-3');
    expect(serialized).toContain('emp-1');
  });

  it('does not widen an OWN scope even when departments are present', async () => {
    const prisma = db(true);

    await assertConfigurationAccessible(prisma as never, 'cfg-1', {
      employeeId: 'emp-1',
      departmentIds: ['dep-1'],
      scope: 'OWN',
    });

    expect(prisma.employeeDepartment.findMany).not.toHaveBeenCalled();
  });
});
