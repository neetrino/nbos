import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  refreshBonusEntryStatusAfterReleasesChange,
  syncBonusEntryStatusesForOrder,
} from './bonus-entry-status-sync';

function createDbMock() {
  return {
    bonusEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    bonusRelease: {
      aggregate: vi.fn(),
    },
  };
}

describe('refreshBonusEntryStatusAfterReleasesChange', () => {
  let db: ReturnType<typeof createDbMock>;

  beforeEach(() => {
    db = createDbMock();
  });

  it('promotes INCOMING to ACTIVE when counting releases exist', async () => {
    db.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'INCOMING',
      amount: new Decimal(100),
    });
    db.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(10) } });

    await refreshBonusEntryStatusAfterReleasesChange(db as never, 'be1');

    expect(db.bonusEntry.update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: { status: 'ACTIVE' },
    });
  });

  it('sets PAID when paid releases cover planned amount', async () => {
    db.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'ACTIVE',
      amount: new Decimal(100),
    });
    db.bonusRelease.aggregate.mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } });

    await refreshBonusEntryStatusAfterReleasesChange(db as never, 'be1');

    expect(db.bonusEntry.update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: { status: 'PAID' },
    });
  });

  it('does not change PAID entries', async () => {
    db.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'PAID',
      amount: new Decimal(50),
    });

    await refreshBonusEntryStatusAfterReleasesChange(db as never, 'be1');

    expect(db.bonusRelease.aggregate).not.toHaveBeenCalled();
    expect(db.bonusEntry.update).not.toHaveBeenCalled();
  });

  it('demotes ACTIVE to INCOMING when no counting releases', async () => {
    db.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'ACTIVE',
      amount: new Decimal(100),
    });
    db.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });

    await refreshBonusEntryStatusAfterReleasesChange(db as never, 'be1');

    expect(db.bonusEntry.update).toHaveBeenCalledWith({
      where: { id: 'be1' },
      data: { status: 'INCOMING' },
    });
  });
});

describe('syncBonusEntryStatusesForOrder', () => {
  it('refreshes each entry on the order', async () => {
    const db = createDbMock();
    db.bonusEntry.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    db.bonusEntry.findUnique
      .mockResolvedValueOnce({ id: 'a', status: 'INCOMING', amount: new Decimal(100) })
      .mockResolvedValueOnce({ id: 'b', status: 'ACTIVE', amount: new Decimal(100) });
    db.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(1) } })
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });

    await syncBonusEntryStatusesForOrder(db as never, 'ord1');

    expect(db.bonusEntry.findMany).toHaveBeenCalledWith({
      where: { orderId: 'ord1' },
      select: { id: true },
    });
    expect(db.bonusEntry.update).toHaveBeenCalledTimes(2);
  });
});
