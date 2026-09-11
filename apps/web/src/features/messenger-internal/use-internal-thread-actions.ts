'use client';

import { useMemo, useState } from 'react';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import {
  copySourceFromMessages,
  openOriginalBySourceIds,
  openOriginalFromMessages,
} from './open-original-source';
import { sortSelectedMessages } from './sort-selected-messages';

export function useInternalThreadActions(
  messages: MessengerCoreMessageRow[],
  onOpenInternalSource?: (conversationId: string) => void,
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<MessengerCoreMessageRow | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const selectedMessages = useMemo(
    () => sortSelectedMessages(messages.filter((row) => selectedIds.includes(row.id))),
    [messages, selectedIds],
  );

  return {
    selectedIds,
    selectedMessages,
    replyTo,
    forwardOpen,
    createTaskOpen,
    toggleSelect: (id: string) =>
      setSelectedIds((current) =>
        current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
      ),
    clearSelection: () => setSelectedIds([]),
    startReply: () => setReplyTo(selectedMessages[0] ?? null),
    clearReply: () => setReplyTo(null),
    setForwardOpen,
    setCreateTaskOpen,
    openOriginal: () =>
      void openOriginalFromMessages(selectedMessages, {
        getSourceMessage: (id) => messengerCoreApi.getSourceMessage(id),
        onOpenInternalSource,
      }),
    openOriginalBySourceId: (sourceMessageId: string) =>
      void openOriginalBySourceIds([sourceMessageId], {
        getSourceMessage: (id) => messengerCoreApi.getSourceMessage(id),
        onOpenInternalSource,
      }),
    copySource: () =>
      void copySourceFromMessages(selectedMessages, {
        getSourceMessage: (id) => messengerCoreApi.getSourceMessage(id),
      }),
  };
}
