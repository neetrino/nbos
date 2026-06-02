import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmployeeReactivationService } from './employee-reactivation.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('EmployeeReactivationService', () => {
  let service: EmployeeReactivationService;
  let prisma: MockPrisma;
  const audit = { log: vi.fn() };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new EmployeeReactivationService(prisma as never, audit as never);
    vi.clearAllMocks();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('rejects actors without owner, ceo, or hr access', async () => {
    await expect(service.execute('e1', 'actor', 'developer', { status: 'ACTIVE' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects non-terminated employees', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      firstName: 'Ann',
      lastName: 'Lee',
      status: 'ACTIVE',
      fireDate: null,
    });

    await expect(service.execute('e1', 'actor', 'ceo', { status: 'ACTIVE' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('reactivates terminated employee for ceo', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      firstName: 'Ann',
      lastName: 'Lee',
      status: 'TERMINATED',
      fireDate: new Date('2026-05-01'),
    });
    prisma.checklistTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      activeVersionId: 'ver-1',
      activeVersion: { id: 'ver-1' },
    });
    prisma.checklistInstance.create.mockResolvedValue({ id: 'chk-1' });
    prisma.employee.update.mockResolvedValue({ id: 'e1', status: 'PROBATION', fireDate: null });

    const result = await service.execute('e1', 'actor', 'ceo', { status: 'PROBATION' });

    expect(result.status).toBe('PROBATION');
    expect(result.fireDate).toBeNull();
    expect(result.checklistInstanceId).toBe('chk-1');
    expect(prisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'PROBATION', fireDate: null },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'employee.reactivate' }),
    );
  });

  it('allows hr department members', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([{ department: { slug: 'hr' } }]);
    prisma.employee.findUnique.mockResolvedValue({
      id: 'e1',
      firstName: 'Ann',
      lastName: 'Lee',
      status: 'TERMINATED',
      fireDate: new Date('2026-05-01'),
    });
    prisma.checklistTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      activeVersionId: 'ver-1',
      activeVersion: { id: 'ver-1' },
    });
    prisma.checklistInstance.create.mockResolvedValue({ id: 'chk-1' });
    prisma.employee.update.mockResolvedValue({ id: 'e1', status: 'ACTIVE', fireDate: null });

    await expect(service.execute('e1', 'actor', 'pm', { status: 'ACTIVE' })).resolves.toMatchObject(
      {
        status: 'ACTIVE',
      },
    );
  });

  it('throws when employee is missing', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(service.execute('missing', 'actor', 'ceo', { status: 'ACTIVE' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
