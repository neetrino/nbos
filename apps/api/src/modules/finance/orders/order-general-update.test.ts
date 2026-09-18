import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyOrderGeneralUpdate, parseUpdateOrderGeneralInput } from './order-general-update';

describe('parseUpdateOrderGeneralInput', () => {
  it('trims notes and clears whitespace to null', () => {
    expect(parseUpdateOrderGeneralInput({ notes: '  Keep  ' })).toEqual({ notes: 'Keep' });
    expect(parseUpdateOrderGeneralInput({ notes: '   ' })).toEqual({ notes: null });
    expect(parseUpdateOrderGeneralInput({ notes: null })).toEqual({ notes: null });
  });

  it('rejects an empty patch', () => {
    expect(() => parseUpdateOrderGeneralInput({})).toThrow(BadRequestException);
  });
});

describe('applyOrderGeneralUpdate', () => {
  it('writes notes when the order exists', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({ id: 'ord-1' }),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await applyOrderGeneralUpdate(prisma as never, 'ord-1', { notes: 'Follow up' });

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-1' },
      data: { notes: 'Follow up' },
    });
  });

  it('rejects a missing order', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    };

    await expect(
      applyOrderGeneralUpdate(prisma as never, 'missing', { notes: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
