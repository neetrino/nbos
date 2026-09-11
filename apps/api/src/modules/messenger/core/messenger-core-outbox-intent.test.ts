import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ensureWhatsAppSendCommand } from './messenger-core-outbox.ops';
import { MESSENGER_AUDIT_EXTERNAL_SEND_INTENDED } from './messenger-outbound-audit';

const CHAT = '37499111222@c.us';
const INPUT = {
  conversationId: 'conv-c',
  messageId: 'msg-1',
  idempotencyKey: 'core-wa-send:msg-1',
  payload: { accountId: 'acc_a', chatId: CHAT },
  allowCreate: true,
};

const ROW = {
  id: 'cmd-1',
  status: 'PENDING',
  conversationId: 'conv-c',
  resultMessageId: 'msg-1',
  kind: 'SEND_MESSAGE',
  payload: { accountId: 'acc_a', chatId: CHAT },
};

describe('P4B-11 intent audit creator', () => {
  it('writes intended audit only when this transaction inserted the command', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValue(ROW),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    await ensureWhatsAppSendCommand(prisma as never, INPUT);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: MESSENGER_AUDIT_EXTERNAL_SEND_INTENDED }),
      }),
    );
  });

  it('same-identity loser returns the row with no audit', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue(ROW),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: { create: vi.fn() },
    };
    const row = await ensureWhatsAppSendCommand(prisma as never, INPUT);
    expect(row).toEqual({ id: 'cmd-1', status: 'PENDING' });
    expect(prisma.messengerCommand.createMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('conflict loser throws without mutation or audit', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue({
          ...ROW,
          conversationId: 'conv-other',
          resultMessageId: 'msg-other',
        }),
        createMany: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    };
    await expect(ensureWhatsAppSendCommand(prisma as never, INPUT)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.messengerCommand.createMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('createMany loser with same identity returns the row with no audit', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValue(ROW),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: { create: vi.fn() },
    };
    const row = await ensureWhatsAppSendCommand(prisma as never, INPUT);
    expect(row).toEqual({ id: 'cmd-1', status: 'PENDING' });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('createMany loser with conflicting identity throws without audit', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValue({
            ...ROW,
            conversationId: 'conv-other',
            resultMessageId: 'msg-other',
          }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: { create: vi.fn() },
    };
    await expect(ensureWhatsAppSendCommand(prisma as never, INPUT)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
