'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { deleteOwnSelectedMessages } from './delete-own-selected-messages';
import {
  copySourceFromMessages,
  openOriginalBySourceIds,
  openOriginalFromMessages,
} from './open-original-source';
import { canonicalSourceMessageIds } from './canonical-source-message-ids';
import { sortSelectedMessages } from './sort-selected-messages';

export function useInternalThreadActions(
  messages: MessengerCoreMessageRow[],
  onOpenInternalSource?: (conversationId: string) => void,
  meId?: string | null,
) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    opensUp?: boolean;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<MessengerCoreMessageRow | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardSourceIds, setForwardSourceIds] = useState<string[]>([]);
  const [forwardPreview, setForwardPreview] = useState<{
    senderName: string;
    content: string;
  } | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectedMessages = useMemo(
    () => sortSelectedMessages(messages.filter((row) => selectedIds.includes(row.id))),
    [messages, selectedIds],
  );

  return {
    selectedIds,
    selectedMessages,
    selecting,
    menuAnchor,
    replyTo,
    forwardOpen,
    forwardSourceIds,
    forwardPreview,
    createTaskOpen,
    deleteConfirmOpen,
    deleteSubmitting,
    deleteError,
    deleteOwnCount: selectedMessages.filter((row) => row.senderId === meId).length,
    setDeleteConfirmOpen,
    toggleSelect: (id: string) =>
      setSelectedIds((current) =>
        current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
      ),
    selectOnly: (id: string) => setSelectedIds([id]),
    openActionMenu: (id: string, x: number, y: number, opensUp = false) => {
      if (!selecting) setSelectedIds([id]);
      setMenuAnchor({ x, y, opensUp });
    },
    closeActionMenu: () => setMenuAnchor(null),
    startSelecting: () => {
      setSelecting(true);
      setMenuAnchor(null);
    },
    clearSelection: () => {
      setSelectedIds([]);
      setSelecting(false);
    },
    startReply: (messageId?: string) => {
      const id = messageId ?? selectedIds[0] ?? selectedMessages[0]?.id;
      const target = messages.find((row) => row.id === id) ?? selectedMessages[0] ?? null;
      setReplyTo(target);
      setSelecting(false);
      setMenuAnchor(null);
    },
    clearReply: () => setReplyTo(null),
    openForward: () => {
      const fromSelected = selectedMessages.flatMap(canonicalSourceMessageIds);
      const ids = fromSelected.length > 0 ? fromSelected : selectedIds;
      const first = selectedMessages[0];
      setForwardSourceIds(ids);
      setForwardPreview(
        first
          ? {
              senderName: first.forwardedFrom ?? first.senderName,
              content: first.forwardedContent ?? first.content,
            }
          : null,
      );
      setForwardOpen(true);
      setMenuAnchor(null);
    },
    setForwardOpen: (open: boolean) => {
      if (!open) {
        setForwardSourceIds([]);
        setForwardPreview(null);
      }
      setForwardOpen(open);
    },
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
    canDeleteOwn: Boolean(meId) && selectedMessages.some((row) => row.senderId === meId),
    requestDelete: () => {
      setMenuAnchor(null);
      setDeleteError(null);
      setDeleteConfirmOpen(true);
    },
    confirmDelete: async () => {
      setDeleteSubmitting(true);
      setDeleteError(null);
      try {
        await deleteOwnSelectedMessages(queryClient, selectedMessages, meId);
        setSelectedIds([]);
        setSelecting(false);
        setMenuAnchor(null);
        setDeleteConfirmOpen(false);
      } catch (error) {
        setDeleteError(getApiErrorMessage(error, 'Could not delete messages'));
      } finally {
        setDeleteSubmitting(false);
      }
    },
  };
}
