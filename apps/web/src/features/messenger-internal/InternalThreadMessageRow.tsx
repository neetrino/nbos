'use client';

import { messengerDateLabel } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { MessengerThreadMessageBubble } from '@/features/messenger/messenger-thread-primitives';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { MessageDate, MessageSelect } from './InternalThreadChrome';
import { InternalForwardReferenceCard } from './InternalForwardReferenceCard';
import { InternalSheetMessage } from './InternalSheetMessage';
import { pointForMessageActionMenu } from './message-action-menu-position';

export function ThreadMessageRow({
  message,
  previous,
  next,
  selected,
  references,
  onToggleSelect,
  onMessageContextMenu,
  onOpenOriginalSource,
  selecting = false,
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
  selecting?: boolean;
  sheet: boolean;
  mine: boolean;
}) {
  const showDate =
    !previous || messengerDateLabel(previous.timestamp) !== messengerDateLabel(message.timestamp);
  const continued = sameSenderRun(previous, message);
  const rowGap = sheet && previous ? (continued ? 'mt-1' : 'mt-4') : '';
  return (
    <div
      data-message-id={message.id}
      className={`group flex items-start gap-1 rounded-none transition-colors duration-200 data-[reply-flash]:bg-[#4f46e5]/25 ${rowGap} ${
        selecting ? 'cursor-pointer px-1' : ''
      } ${selecting && selected ? 'bg-[#4f46e5]/10' : ''}`}
      onContextMenu={(event) => {
        if (!onMessageContextMenu) return;
        event.preventDefault();
        const point = pointForMessageActionMenu(event.currentTarget);
        onMessageContextMenu(message.id, point.x, point.y);
      }}
      onClick={() => {
        if (selecting) onToggleSelect(message.id);
      }}
    >
      {sheet && !selecting ? null : (
        <MessageSelect
          selected={selected}
          selecting={selecting}
          onToggle={() => onToggleSelect(message.id)}
        />
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
