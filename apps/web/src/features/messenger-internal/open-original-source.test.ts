import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MessengerCoreMessageRow,
  MessengerCoreSourceMessageRow,
} from '@/lib/api/messenger-core';
import {
  copySourceFromMessages,
  openOriginalBySourceIds,
  openOriginalFromMessages,
  sourceIdsForOpenOriginal,
} from './open-original-source';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

vi.mock('@/lib/api-errors', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const HOLDER: MessengerCoreMessageRow = {
  id: 'hold-1',
  conversationId: 'conv-target',
  senderId: 'e1',
  senderName: 'Ada',
  content: 'hello world preview truncated',
  createdAt: '2026-08-31T12:00:00.000Z',
  editedAt: null,
  attachments: [],
  references: [
    {
      id: 'ref-1',
      purpose: 'FORWARD',
      sourceMessageId: 'src-1',
      sourceConversationId: 'conv-src',
      sortOrder: 0,
      entityType: null,
      entityId: null,
    },
  ],
};

function sourceRow(
  overrides: Partial<MessengerCoreSourceMessageRow> = {},
): MessengerCoreSourceMessageRow {
  return {
    id: 'src-1',
    conversationId: 'conv-src',
    senderId: 'e2',
    senderName: 'Ben',
    content: 'full canonical source body',
    createdAt: '2026-08-31T11:00:00.000Z',
    editedAt: null,
    attachments: [],
    zone: 'INTERNAL',
    conversationType: 'INTERNAL_GROUP',
    ...overrides,
  };
}

describe('open original / copy source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves sourceMessageId from a FORWARD holder, not holder.id', () => {
    expect(sourceIdsForOpenOriginal([HOLDER])).toEqual(['src-1']);
    expect(sourceIdsForOpenOriginal([HOLDER])).not.toContain('hold-1');
  });

  it('GETs sourceMessageId and opens the source conversation, not the target', async () => {
    const getSourceMessage = vi.fn().mockResolvedValue(sourceRow());
    const onOpenInternalSource = vi.fn();
    await openOriginalFromMessages([HOLDER], { getSourceMessage, onOpenInternalSource });
    expect(getSourceMessage).toHaveBeenCalledWith('src-1');
    expect(getSourceMessage).not.toHaveBeenCalledWith('hold-1');
    expect(onOpenInternalSource).toHaveBeenCalledWith('conv-src');
    expect(onOpenInternalSource).not.toHaveBeenCalledWith('conv-target');
  });

  it('card Open original GETs the given sourceMessageId', async () => {
    const getSourceMessage = vi.fn().mockResolvedValue(sourceRow());
    const onOpenInternalSource = vi.fn();
    await openOriginalBySourceIds(['src-1'], { getSourceMessage, onOpenInternalSource });
    expect(getSourceMessage).toHaveBeenCalledWith('src-1');
    expect(onOpenInternalSource).toHaveBeenCalledWith('conv-src');
  });

  it('does not navigate when source GET 404s even if the caller can read the target', async () => {
    const getSourceMessage = vi.fn().mockRejectedValue(new Error('Conversation not found'));
    const onOpenInternalSource = vi.fn();
    await openOriginalFromMessages([HOLDER], { getSourceMessage, onOpenInternalSource });
    expect(getSourceMessage).toHaveBeenCalledWith('src-1');
    expect(onOpenInternalSource).not.toHaveBeenCalled();
  });

  it('copy source copies the GET source body, not the holder preview', async () => {
    const getSourceMessage = vi.fn().mockResolvedValue(sourceRow());
    const writeText = vi.fn().mockResolvedValue(undefined);
    await copySourceFromMessages([HOLDER], { getSourceMessage, writeText });
    expect(getSourceMessage).toHaveBeenCalledWith('src-1');
    expect(getSourceMessage).not.toHaveBeenCalledWith('hold-1');
    expect(writeText).toHaveBeenCalledWith('full canonical source body');
    expect(writeText).not.toHaveBeenCalledWith(HOLDER.content);
  });
});
