'use client';

import { CheckCheck, Paperclip } from 'lucide-react';
import { formatMessengerTime } from '@/features/messenger/messenger-format';
import type { MessengerViewMessage } from '@/features/messenger/messenger-message-mapper';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';
import {
  SHEET_BUBBLE_LARGE_RADIUS_CLASS,
  SHEET_BUBBLE_WRAP_CHAR_COUNT,
} from './internal-messenger.constants';
import { useSheetMessengerPalette } from './sheet-messenger-palette';

const SHEET_BUBBLE_BASE = 'max-w-lg px-3 py-1.5 text-sm leading-5';

function isWrappingBubble(content: string): boolean {
  return content.includes('\n') || content.length >= SHEET_BUBBLE_WRAP_CHAR_COUNT;
}

function sheetBubbleRadiusClass(content: string, tail: 'tl' | 'tr'): string {
  if (isWrappingBubble(content)) return SHEET_BUBBLE_LARGE_RADIUS_CLASS;
  return tail === 'tl' ? 'rounded-3xl rounded-tl-sm' : 'rounded-3xl rounded-tr-sm';
}

export function InternalSheetMessage({
  message,
  mine,
  readReceiptLabel,
  readReceiptSeen = false,
  showAvatar = true,
}: {
  message: MessengerViewMessage;
  mine: boolean;
  readReceiptLabel: string | null;
  readReceiptSeen?: boolean;
  showAvatar?: boolean;
}) {
  if (mine) {
    return (
      <OwnSheetMessage
        message={message}
        readReceiptLabel={readReceiptLabel}
        readReceiptSeen={readReceiptSeen}
        showAvatar={showAvatar}
      />
    );
  }
  return <IncomingSheetMessage message={message} showAvatar={showAvatar} />;
}

function IncomingSheetMessage({
  message,
  showAvatar,
}: {
  message: MessengerViewMessage;
  showAvatar: boolean;
}) {
  return (
    <div className="flex items-end gap-3 px-5">
      <AvatarSlot
        mine={false}
        show={showAvatar}
        employeeId={message.senderId}
        label={message.senderName}
      />
      <div
        data-sheet-bubble=""
        className={`${SHEET_BUBBLE_BASE} ${sheetBubbleRadiusClass(message.content, 'tl')} bg-white text-[#1e293b] shadow-[0px_1px_1px_rgba(0,0,0,0.1)]`}
      >
        <BubbleBody
          content={message.content}
          time={formatMessengerTime(message.timestamp)}
          seen={false}
          showChecks={false}
        />
        <AttachmentRow message={message} />
      </div>
    </div>
  );
}

function OwnSheetMessage({
  message,
  readReceiptLabel,
  readReceiptSeen,
  showAvatar,
}: {
  message: MessengerViewMessage;
  readReceiptLabel: string | null;
  readReceiptSeen: boolean;
  showAvatar: boolean;
}) {
  const palette = useSheetMessengerPalette();
  return (
    <div className="flex items-end justify-end gap-3 px-5">
      <div
        data-sheet-bubble=""
        className={`${SHEET_BUBBLE_BASE} ${sheetBubbleRadiusClass(message.content, 'tr')} text-white ${palette.ownBubble}`}
      >
        <BubbleBody
          content={message.content}
          time={formatMessengerTime(message.timestamp)}
          seen={readReceiptSeen}
          showChecks={Boolean(readReceiptLabel)}
        />
        <AttachmentRow message={message} light />
      </div>
      <AvatarSlot mine show={showAvatar} employeeId={message.senderId} label={message.senderName} />
    </div>
  );
}

function BubbleBody({
  content,
  time,
  seen,
  showChecks,
}: {
  content: string;
  time: string;
  seen: boolean;
  showChecks: boolean;
}) {
  const stamp = <BubbleStamp time={time} seen={seen} showChecks={showChecks} />;
  if (!isWrappingBubble(content)) {
    return (
      <p className="whitespace-pre-wrap">
        {content}
        <span className="ml-2 align-bottom">{stamp}</span>
      </p>
    );
  }
  return (
    <>
      <p className="whitespace-pre-wrap">{content}</p>
      <div className="mt-0.5 flex justify-end">{stamp}</div>
    </>
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
  const palette = useSheetMessengerPalette();
  const tone = showChecks ? 'text-white/75' : 'text-[#94a3b8]';
  const checks = seen ? palette.seenCheck : palette.unseenCheck;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] leading-none ${tone}`}>
      {time}
      {showChecks ? <CheckCheck size={14} aria-hidden className={checks} /> : null}
    </span>
  );
}

function AvatarSlot({
  mine,
  show,
  employeeId,
  label,
}: {
  mine: boolean;
  show: boolean;
  employeeId?: string;
  label: string;
}) {
  if (!show) return <span className="size-9 shrink-0" aria-hidden />;
  return <MessageAvatar mine={mine} employeeId={employeeId} label={label} />;
}

function MessageAvatar({
  mine,
  employeeId,
  label,
}: {
  mine: boolean;
  employeeId?: string;
  label: string;
}) {
  const palette = useSheetMessengerPalette();
  const tone = mine ? 'bg-white text-[#334155]' : palette.incomingAvatar;
  return (
    <MessengerPersonAvatar
      employeeId={employeeId}
      label={label}
      sizeClassName="size-9"
      fallbackClassName={tone}
    />
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
