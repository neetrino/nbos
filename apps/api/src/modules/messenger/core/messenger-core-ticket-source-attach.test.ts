import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreActionsService } from './messenger-core-actions.service';

describe('FINDING-S10-03 attachTicketSources access', () => {
  const prisma = {
    supportTicket: { findUnique: vi.fn() },
    messengerMessage: { findMany: vi.fn(), findUnique: vi.fn() },
    messengerMessageReference: { create: vi.fn() },
  };
  const core = {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireEditAccess: vi.fn(),
  };
  const gateway = { emitCoreConversationMessage: vi.fn(), publishPersistedCoreMessage: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.supportTicket.findUnique = vi.fn().mockResolvedValue({ id: 't1' });
    prisma.messengerMessage.findMany = vi.fn().mockResolvedValue([
      {
        id: 'src-1',
        conversationId: 'client-1',
        content: 'client body',
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    ]);
    prisma.messengerMessage.findUnique = vi
      .fn()
      .mockResolvedValue({ id: 'src-1', conversationId: 'client-1' });
    prisma.messengerMessageReference.create = vi
      .fn()
      .mockResolvedValue({ id: 'ref-1', sourceMessageId: 'src-1' });
    core.requireEditAccess.mockRejectedValue(
      new ForbiddenException('No permission: MESSENGER.EDIT'),
    );
  });

  it('attaches with Support ADD and MESSENGER EDIT NONE when source READ succeeds', async () => {
    core.requireRead.mockResolvedValue(undefined);
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    const result = await service.attachTicketSources('support-add', ['src-1'], 't1');
    expect(result.createdConversation).toBe(false);
    expect(result.sourceMessageIds).toEqual(['src-1']);
    expect(core.requireEditAccess).not.toHaveBeenCalled();
    expect(core.requireRead).toHaveBeenCalledWith('client-1', 'support-add');
    expect(prisma.messengerMessageReference.create).toHaveBeenCalled();
  });

  it('does not attach when source Client READ fails', async () => {
    core.requireRead.mockRejectedValue(new NotFoundException('Conversation not found'));
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(
      service.attachTicketSources('support-add', ['src-1'], 't1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(core.requireEditAccess).not.toHaveBeenCalled();
    expect(prisma.messengerMessageReference.create).not.toHaveBeenCalled();
  });
});
