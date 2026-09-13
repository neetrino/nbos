import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { EmployeeInterfaceLocaleService } from './employee-interface-locale.service';

describe('EmployeeInterfaceLocaleService', () => {
  let service: EmployeeInterfaceLocaleService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new EmployeeInterfaceLocaleService(prisma as never);
  });

  it('returns the stored writable locale', async () => {
    prisma.employee.findUnique.mockResolvedValue({ interfaceLocale: 'ru' });
    await expect(service.getPreferences('emp-1')).resolves.toEqual({ interfaceLocale: 'ru' });
    expect(prisma.employee.findUnique).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      select: { interfaceLocale: true },
    });
  });

  it('returns a stored Armenian locale', async () => {
    prisma.employee.findUnique.mockResolvedValue({ interfaceLocale: 'hy' });
    await expect(service.getPreferences('emp-1')).resolves.toEqual({ interfaceLocale: 'hy' });
  });

  it('falls back to en when stored value is not writable', async () => {
    prisma.employee.findUnique.mockResolvedValue({ interfaceLocale: 'de' });
    await expect(service.getPreferences('emp-1')).resolves.toEqual({ interfaceLocale: 'en' });
  });

  it('throws when the employee is missing', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(service.getPreferences('missing')).rejects.toThrow(NotFoundException);
  });

  it('writes only the authenticated employee id', async () => {
    prisma.employee.update.mockResolvedValue({ interfaceLocale: 'ru' });
    await expect(service.updatePreferences('emp-1', 'ru')).resolves.toEqual({
      interfaceLocale: 'ru',
    });
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      data: { interfaceLocale: 'ru' },
      select: { interfaceLocale: true },
    });
  });

  it('throws when updating a missing employee', async () => {
    prisma.employee.update.mockRejectedValue({ code: 'P2025' });
    await expect(service.updatePreferences('missing', 'ru')).rejects.toThrow(NotFoundException);
  });

  it('rethrows unexpected update failures', async () => {
    prisma.employee.update.mockRejectedValue(new Error('db down'));
    await expect(service.updatePreferences('emp-1', 'ru')).rejects.toThrow('db down');
  });
});
