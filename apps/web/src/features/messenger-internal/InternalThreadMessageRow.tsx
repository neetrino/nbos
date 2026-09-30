'use client';

import { messengerDateLabel } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { MessengerThreadMessageBubble } from '@/features/messenger/messenger-thread-primitives';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { MessageDate, MessageSelect } from './InternalThreadChrome';
import { InternalForwardReferenceCard } from './InternalForwardReferenceCard';
import { InternalSheetMessage } from './InternalSheetMessage';

export function ThreadMessageRow({
  message,
  previous,
  next,
  selected,
  references,
  onToggleSelect,
  onMessageContextMenu,
  onOpenOriginalSource,
  sheet,
  mine,
}: {
  message: MessengerViewMessage;
  previous: MessengerViewMessage | undefined;
  next: MessengerViewMessage | undefined;
  selected: boolean;
  references: NonNullable<MessengerCoreMessageRow['references']>;
  onToggleSelect: (id: string) => void;
  onMessageContextMenu?: (id: string, x: number, y: number) => void;
  onOpenOriginalSource: (sourceMessageId: string) => void;
  sheet: boolean;
  mine: boolean;
}) {
  const showDate =
    !previous || messengerDateLabel(previous.timestamp) !== messengerDateLabel(message.timestamp);
  const continued = sameSenderRun(previous, message);
  const rowGap = sheet && previous ? (continued ? 'mt-1' : 'mt-4') : '';
  return (
    <div
      className={`group flex items-start gap-1 ${rowGap}`}
      onContextMenu={(event) => {
        if (!onMessageContextMenu) return;
        event.preventDefault();
        onMessageContextMenu(message.id, event.clientX, event.clientY);
      }}
    >
      {sheet ? null : (
        <MessageSelect selected={selected} onToggle={() => onToggleSelect(message.id)} />
      )}
      <div className="min-w-0 flex-1">
        {showDate ? (
          <MessageDate label={messengerDateLabel(message.timestamp)} sheet={sheet} />
        ) : null}
        <RowBubble
          message={message}
          mine={mine}
          sheet={sheet}
          showAvatar={!sameSenderRun(message, next)}
        />
        <InternalForwardReferenceCard
          references={references}
          onOpenOriginal={onOpenOriginalSource}
        />
      </div>
    </div>
  );
}

function sameSenderRun(
  current: MessengerViewMessage | undefined,
  other: MessengerViewMessage | undefined,
): boolean {
  if (!current || !other || current.senderId !== other.senderId) return false;
  return messengerDateLabel(current.timestamp) === messengerDateLabel(other.timestamp);
}

function RowBubble({
  message,
  mine,
  sheet,
  showAvatar,
}: {
  message: MessengerViewMessage;
  mine: boolean;
  sheet: boolean;
  showAvatar: boolean;
}) {
  if (!sheet) {
    return (
      <MessengerThreadMessageBubble
        message={message}
        readReceiptLabel={message.deliveryLabel ?? null}
      />
    );
  }
  return (
    <InternalSheetMessage
      message={message}
      mine={mine}
      readReceiptLabel={message.deliveryLabel ?? null}
      readReceiptSeen={Boolean(message.receiptSeen)}
      showAvatar={showAvatar}
    />
  );
}
