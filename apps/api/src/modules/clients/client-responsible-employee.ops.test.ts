import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  normalizeResponsibleEmployeeId,
  resolveMergedResponsibleEmployeeId,
} from './client-responsible-employee.ops';

describe('normalizeResponsibleEmployeeId', () => {
  it('leaves omitted values untouched', async () => {
    const prisma = { employee: { findUnique: vi.fn() } };
    await expect(
      normalizeResponsibleEmployeeId(prisma as never, undefined),
    ).resolves.toBeUndefined();
    expect(prisma.employee.findUnique).not.toHaveBeenCalled();
  });

  it('clears empty and null', async () => {
    const prisma = { employee: { findUnique: vi.fn() } };
    await expect(normalizeResponsibleEmployeeId(prisma as never, null)).resolves.toBeNull();
    await expect(normalizeResponsibleEmployeeId(prisma as never, '  ')).resolves.toBeNull();
  });

  it('returns the id when the employee exists', async () => {
    const prisma = { employee: { findUnique: vi.fn().mockResolvedValue({ id: 'emp-1' }) } };
    await expect(normalizeResponsibleEmployeeId(prisma as never, 'emp-1')).resolves.toBe('emp-1');
  });

  it('rejects an unknown employee', async () => {
    const prisma = { employee: { findUnique: vi.fn().mockResolvedValue(null) } };
    await expect(normalizeResponsibleEmployeeId(prisma as never, 'missing')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('resolveMergedResponsibleEmployeeId', () => {
  it('keeps the survivor when set', () => {
    expect(resolveMergedResponsibleEmployeeId('surv', 'abs')).toBe('surv');
  });

  it('takes absorbed when survivor is empty', () => {
    expect(resolveMergedResponsibleEmployeeId(null, 'abs')).toBe('abs');
    expect(resolveMergedResponsibleEmployeeId(undefined, 'abs')).toBe('abs');
  });
});
