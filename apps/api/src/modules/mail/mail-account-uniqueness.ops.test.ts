import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  MAIL_DISABLED_STATUS,
  MAIL_DUPLICATE_LIVE_MAILBOX_MESSAGE,
  MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE,
  normalizeMailboxEmail,
  pickMailboxForReconnect,
  resolveMailboxConnectTarget,
  resolveMailboxForConnect,
} from './mail-account-uniqueness.ops';
import type { MailboxUniquenessRow } from './mail-account-uniqueness.ops';

function row(
  overrides: Partial<MailboxUniquenessRow> & Pick<MailboxUniquenessRow, 'id'>,
): MailboxUniquenessRow {
  return {
    ownerEmployeeId: 'owner-1',
    status: 'ACTIVE',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('mailbox uniqueness helper', () => {
  it('normalizes mailbox email for lookup', () => {
    expect(normalizeMailboxEmail('  Test@Neetrino.com ')).toBe('test@neetrino.com');
  });

  it('reuses the newest DISABLED row when the owner has no live mailbox', () => {
    const older = row({
      id: 'old',
      status: MAIL_DISABLED_STATUS,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = row({
      id: 'new',
      status: MAIL_DISABLED_STATUS,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    });
    expect(pickMailboxForReconnect([older, newer])?.id).toBe('new');
  });

  it('prefers a live row over DISABLED leftovers for the same owner', () => {
    const disabled = row({ id: 'off', status: MAIL_DISABLED_STATUS });
    const live = row({
      id: 'live',
      status: 'NEEDS_RECONNECT',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });
    expect(pickMailboxForReconnect([disabled, live])?.id).toBe('live');
  });

  it('resolves Connect to reuse the owner DISABLED row', () => {
    const disabled = row({ id: 'acc-disabled', status: MAIL_DISABLED_STATUS });
    expect(resolveMailboxConnectTarget('owner-1', [disabled])).toEqual({
      kind: 'reuse',
      account: disabled,
    });
  });

  it('creates a new row when only another owner has DISABLED leftovers', () => {
    const leftover = row({
      id: 'other-off',
      ownerEmployeeId: 'owner-2',
      status: MAIL_DISABLED_STATUS,
    });
    expect(resolveMailboxConnectTarget('owner-1', [leftover])).toEqual({ kind: 'create' });
  });

  it('conflicts when another owner already has a live mailbox', () => {
    const live = row({ id: 'sales', ownerEmployeeId: 'owner-a', status: 'ACTIVE' });
    expect(() => resolveMailboxConnectTarget('owner-b', [live])).toThrow(ConflictException);
    expect(() => resolveMailboxConnectTarget('owner-b', [live])).toThrow(
      MAIL_LIVE_MAILBOX_CONFLICT_MESSAGE,
    );
  });

  it('conflicts when two live rows exist for the same email', () => {
    const first = row({ id: 'one', status: 'ACTIVE' });
    const second = row({ id: 'two', ownerEmployeeId: 'owner-2', status: 'SYNCING' });
    expect(() => resolveMailboxConnectTarget('owner-1', [first, second])).toThrow(
      MAIL_DUPLICATE_LIVE_MAILBOX_MESSAGE,
    );
  });

  it('reuses DISABLED from persistence when resolving Connect', async () => {
    const disabled = {
      ...row({ id: 'acc-disabled', status: MAIL_DISABLED_STATUS }),
      providerConnection: null,
    };
    const prisma = {
      mailAccount: {
        findMany: vi.fn().mockResolvedValue([disabled]),
      },
    };
    const resolved = await resolveMailboxForConnect(
      prisma as never,
      'owner-1',
      'Test@Neetrino.com',
    );
    expect(resolved).toEqual({ kind: 'reuse', account: disabled });
    expect(prisma.mailAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { emailAddress: { equals: 'test@neetrino.com', mode: 'insensitive' } },
      }),
    );
  });
});
