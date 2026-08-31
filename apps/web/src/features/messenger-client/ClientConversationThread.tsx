'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, Star } from 'lucide-react';
import {
  mapMessengerRowToView,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
import { usePermission } from '@/lib/permissions';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import type { MessengerClientConversationRow } from '@/lib/api/messenger-core-client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Task } from '@/lib/api/tasks';
import { InternalCreateTaskFromMessages } from '@/features/messenger-internal/InternalCreateTaskFromMessages';
import { InternalForwardDialog } from '@/features/messenger-internal/InternalForwardDialog';
import { InternalMessageActionsBar } from '@/features/messenger-internal/InternalMessageActionsBar';
import { ThreadComposer, ThreadMessages } from '@/features/messenger-internal/InternalThreadParts';
import { useInternalThreadActions } from '@/features/messenger-internal/use-internal-thread-actions';
import { ClientAiPlaceholder } from './ClientAiPlaceholder';
import { ClientInviteDialog } from './ClientInviteDialog';
import { ClientLockedComposer, ClientUnlockedComposerBanner } from './ClientLockedComposer';
import { clientConversationTitle, clientProviderLabel } from './client-messenger-section';
import { canUnlockClientComposer, isClientComposerUnlocked } from './client-composer-unlock';

function toViewMessages(rows: MessengerCoreMessageRow[]): MessengerViewMessage[] {
  return rows.map((row) =>
    mapMessengerRowToView({
      id: row.id,
      channelId: row.conversationId,
      senderId: row.senderId ?? '',
      senderName: row.senderName,
      content: row.content,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      attachments: row.attachments,
    }),
  );
}

export function ClientConversationThread({
  conversation,
  messages,
  messagesLoading,
  newMessage,
  onNewMessageChange,
  unlockedConversationId,
  onUnlock,
  onSend,
  sendDisabled,
  onToggleFavorite,
  collections,
  onAddToCollection,
  onInvite,
}: {
  conversation: MessengerClientConversationRow;
  messages: MessengerCoreMessageRow[];
  messagesLoading: boolean;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  unlockedConversationId: string | null;
  onUnlock: () => void;
  onSend: (replyToMessageId?: string) => Promise<void> | void;
  sendDisabled: boolean;
  onToggleFavorite: () => void;
  collections: Array<{ id: string; name: string }>;
  onAddToCollection: (collectionId: string) => void;
  onInvite: (employeeId: string) => Promise<void>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const { can } = usePermission();
  const { creatorId, creatorReady } = useTaskCreatorId();
  const actions = useInternalThreadActions(messages);
  const [inviteOpen, setInviteOpen] = useState(false);
  const canSend = Boolean(conversation.canSend);
  const unlocked = isClientComposerUnlocked(unlockedConversationId, conversation.id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const contextLabel = clientConversationTitle(conversation.title, conversation.provider ?? null);

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <ClientThreadHeader
        conversation={conversation}
        title={contextLabel}
        collections={collections}
        onToggleFavorite={onToggleFavorite}
        onAddToCollection={onAddToCollection}
        onInvite={() => setInviteOpen(true)}
      />
      <InternalMessageActionsBar
        selectedCount={actions.selectedMessages.length}
        canReply={actions.selectedMessages.length === 1}
        canCreateTask={can('EDIT', 'TASKS') && Boolean(creatorId)}
        onReply={actions.startReply}
        onForward={() => actions.setForwardOpen(true)}
        onCreateTask={() => actions.setCreateTaskOpen(true)}
        onOpenOriginal={() => void actions.openOriginal()}
        onCopySource={() => void actions.copySource()}
        onClear={actions.clearSelection}
      />
      <ThreadMessages
        views={toViewMessages(messages)}
        messages={messages}
        messagesLoading={messagesLoading}
        selectedIds={actions.selectedIds}
        onToggleSelect={actions.toggleSelect}
        onOpenOriginalSource={actions.openOriginalBySourceId}
        remoteTypingHint={null}
        endRef={endRef}
      />
      <ClientAiPlaceholder />
      {unlocked && canUnlockClientComposer(canSend) ? (
        <>
          <ClientUnlockedComposerBanner
            provider={conversation.provider}
            contextLabel={contextLabel}
          />
          <ThreadComposer
            canSend={canSend}
            sendDisabled={sendDisabled}
            newMessage={newMessage}
            onNewMessageChange={onNewMessageChange}
            replyTo={actions.replyTo}
            onClearReply={actions.clearReply}
            mentions={[]}
            onMentionsChange={() => undefined}
            placeholder="Type a message to the client…"
            onSend={() =>
              void Promise.resolve(onSend(actions.replyTo?.id)).then(() => actions.clearReply())
            }
          />
        </>
      ) : (
        <ClientLockedComposer
          canSend={canSend}
          provider={conversation.provider}
          contextLabel={contextLabel}
          onUnlock={onUnlock}
        />
      )}
      <InternalForwardDialog
        open={actions.forwardOpen}
        currentConversationId={conversation.id}
        onClose={() => actions.setForwardOpen(false)}
        onForward={(targetConversationId) => forwardSelected(targetConversationId, actions)}
      />
      {creatorId ? (
        <InternalCreateTaskFromMessages
          open={actions.createTaskOpen}
          creatorId={creatorId}
          creatorReady={creatorReady}
          defaultLinks={conversation.primaryLinks}
          selectedCount={actions.selectedMessages.length}
          onOpenChange={actions.setCreateTaskOpen}
          onCreated={(task) => void attachSources(task, actions)}
        />
      ) : null}
      <ClientInviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={onInvite}
      />
    </section>
  );
}

function ClientThreadHeader({
  conversation,
  title,
  collections,
  onToggleFavorite,
  onAddToCollection,
  onInvite,
}: {
  conversation: MessengerClientConversationRow;
  title: string;
  collections: Array<{ id: string; name: string }>;
  onToggleFavorite: () => void;
  onAddToCollection: (collectionId: string) => void;
  onInvite: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-teal-900/10 px-5 py-3">
      <Globe size={16} className="text-teal-800" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-black">{title}</h2>
        <p className="text-[11px] text-teal-900/70">
          {clientProviderLabel(conversation.provider)} · Client Messenger
        </p>
      </div>
      <button
        type="button"
        onClick={onInvite}
        className="rounded-lg px-2 py-1 text-[11px] font-medium text-teal-900 hover:bg-teal-800/10"
      >
        Invite specialist
      </button>
      <button
        type="button"
        aria-label={conversation.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={onToggleFavorite}
        className="rounded-lg p-1.5 text-black/35 hover:bg-teal-800/10 hover:text-teal-800"
      >
        <Star size={16} className={conversation.isFavorite ? 'fill-teal-800 text-teal-800' : ''} />
      </button>
      {collections.length > 0 ? (
        <select
          aria-label="Add to Client collection"
          defaultValue=""
          className="max-w-[10rem] rounded-lg border border-teal-900/10 bg-[#F4F7F7] px-2 py-1 text-[11px] text-black"
          onChange={(event) => {
            const collectionId = event.target.value;
            if (!collectionId) return;
            onAddToCollection(collectionId);
            event.target.value = '';
          }}
        >
          <option value="">Add to collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      ) : null}
    </header>
  );
}

async function forwardSelected(
  targetConversationId: string,
  actions: ReturnType<typeof useInternalThreadActions>,
): Promise<void> {
  const result = await messengerCoreApi.forwardMessages(
    targetConversationId,
    actions.selectedMessages.map((row) => row.id),
  );
  if (result.createdConversation !== false) return;
  toast.success('Forwarded internally as a reference');
  actions.clearSelection();
}

async function attachSources(
  task: Task,
  actions: ReturnType<typeof useInternalThreadActions>,
): Promise<void> {
  try {
    await messengerCoreApi.attachTaskSources(
      actions.selectedMessages.map((row) => row.id),
      task.id,
    );
    toast.success('Task created with source references');
    actions.clearSelection();
    actions.setCreateTaskOpen(false);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Task was created but source references failed.'));
  }
}
