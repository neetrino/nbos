import { Paperclip, Send } from 'lucide-react';
import type { MessengerViewMessage } from './messenger-message-mapper';
import { formatMessengerTime } from './messenger-format';
import {
  MESSENGER_THREAD_ACCENT_HEX,
  MESSENGER_THREAD_COMPOSER_INPUT_CLASS,
  MESSENGER_THREAD_COMPOSER_SURFACE_HEX,
} from './messenger-thread-ui.constants';

export function MessengerThreadAvatar({ initials }: { initials: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{
        backgroundColor: `${MESSENGER_THREAD_ACCENT_HEX}26`,
        color: MESSENGER_THREAD_ACCENT_HEX,
      }}
    >
      {initials}
    </div>
  );
}

export function MessengerThreadDateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2">
      <div className="h-px flex-1 bg-black/[0.06]" />
      <span className="text-xs font-medium text-black/40">{label}</span>
      <div className="h-px flex-1 bg-black/[0.06]" />
    </div>
  );
}

export function MessengerThreadMessageBubble({
  message,
  readReceiptLabel,
}: {
  message: MessengerViewMessage;
  readReceiptLabel: string | null;
}) {
  return (
    <div className="group flex gap-3 px-5 py-1.5 hover:bg-black/[0.02]">
      <MessengerThreadAvatar initials={message.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-black">{message.senderName}</span>
          <span className="text-xs text-black/35">{formatMessengerTime(message.timestamp)}</span>
        </div>
        <p className="text-sm leading-relaxed text-black/75">{message.content}</p>
        {message.attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-black/55"
                style={{ backgroundColor: MESSENGER_THREAD_COMPOSER_SURFACE_HEX }}
              >
                <Paperclip size={11} />
                FileAsset {attachment.fileAssetId.slice(0, 8)}
              </span>
            ))}
          </div>
        ) : null}
        {readReceiptLabel ? (
          <p className="mt-0.5 text-[10px] font-medium text-black/35">{readReceiptLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Centered system / timeline line (e.g. task activity before messenger wiring). */
export function MessengerThreadNotice({ text, subText }: { text: string; subText?: string }) {
  return (
    <div className="flex justify-center px-5 py-2">
      <p className="max-w-lg text-center text-xs leading-relaxed text-black/50">
        <span className="font-medium text-black/65">{text}</span>
        {subText ? <span className="text-black/40"> · {subText}</span> : null}
      </p>
    </div>
  );
}

export function MessengerThreadComposerRow({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
  onTypingIntent,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
  sendDisabled: boolean;
  onTypingIntent?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (next.trim().length > 0) onTypingIntent?.();
        }}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            if (!disabled && !sendDisabled) onSend();
            return;
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!disabled && !sendDisabled) onSend();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={MESSENGER_THREAD_COMPOSER_INPUT_CLASS}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || sendDisabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ backgroundColor: MESSENGER_THREAD_ACCENT_HEX }}
      >
        <Send size={16} />
      </button>
    </div>
  );
}
