'use client';

import { CheckCheck, Paperclip } from 'lucide-react';
import { formatMessengerTime } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';

const SEEN_CHECK_CLASS = 'text-[#93c5fd]';

export function InternalSheetMessage({
  message,
  mine,
  readReceiptLabel,
  readReceiptSeen = false,
}: {
  message: MessengerViewMessage;
  mine: boolean;
  readReceiptLabel: string | null;
  readReceiptSeen?: boolean;
}) {
  if (mine) {
    return (
      <OwnSheetMessage
        message={message}
        readReceiptLabel={readReceiptLabel}
        readReceiptSeen={readReceiptSeen}
      />
    );
  }
  return <IncomingSheetMessage message={message} />;
}

function IncomingSheetMessage({ message }: { message: MessengerViewMessage }) {
  return (
    <div className="flex items-start gap-3 px-5">
      <MessageAvatar initials={message.initials} mine={false} />
      <div className="max-w-2xl min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-2">
          <span className="text-xs text-[#0f172a]">{message.senderName}</span>
          <span className="text-[11px] text-[#94a3b8]">
            {formatMessengerTime(message.timestamp)}
          </span>
        </p>
        <div className="rounded-3xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-[#1e293b] shadow-[0px_1px_1px_rgba(0,0,0,0.1)]">
          <p>{message.content}</p>
          <AttachmentRow message={message} />
        </div>
      </div>
    </div>
  );
}

function OwnSheetMessage({
  message,
  readReceiptLabel,
  readReceiptSeen,
}: {
  message: MessengerViewMessage;
  readReceiptLabel: string | null;
  readReceiptSeen: boolean;
}) {
  return (
    <div className="flex items-end justify-end gap-3 px-5">
      <div className="max-w-lg rounded-3xl rounded-tr-sm bg-[#4f46e5] px-3 py-1.5 text-sm leading-5 text-white">
        <p>
          {message.content}
          <BubbleStamp
            time={formatMessengerTime(message.timestamp)}
            seen={readReceiptSeen}
            showChecks={Boolean(readReceiptLabel)}
          />
        </p>
        <AttachmentRow message={message} light />
      </div>
      <MessageAvatar initials={message.initials} mine />
    </div>
  );
}

function BubbleStamp({
  time,
  seen,
  showChecks,
}: {
  time: string;
  seen: boolean;
  showChecks: boolean;
}) {
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[11px] leading-none text-white/75">
      {time}
      {showChecks ? (
        <CheckCheck size={14} aria-hidden className={seen ? SEEN_CHECK_CLASS : 'text-white/80'} />
      ) : null}
    </span>
  );
}

function MessageAvatar({ initials, mine }: { initials: string; mine: boolean }) {
  const tone = mine
    ? 'bg-white text-[#334155]'
    : 'border border-[#fcd34d] bg-[#fef3c7] text-[#92400e]';
  return (
    <span
      className={`${mine ? '' : 'mt-5'} flex size-9 shrink-0 items-center justify-center rounded-full text-xs ${tone}`}
    >
      {initials}
    </span>
  );
}

function AttachmentRow({
  message,
  light = false,
}: {
  message: MessengerViewMessage;
  light?: boolean;
}) {
  if (message.attachments.length === 0) return null;
  const tone = light ? 'bg-white/15 text-white' : 'bg-[#f8fafc] text-[#64748b]';
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {message.attachments.map((attachment) => (
        <span
          key={attachment.id}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${tone}`}
        >
          <Paperclip size={11} />
          File {attachment.fileAssetId.slice(0, 8)}
        </span>
      ))}
    </div>
  );
}
