import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import type { Task } from '@/lib/api/tasks';
import { formatTaskChatDateLabel, formatTaskSheetDateTime } from './task-sheet-format';
import {
  initialsFromDisplayName,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
import { ThreadAvatar } from '@/features/messenger-internal/InternalThreadChrome';
import {
  MessengerThreadDateDivider,
  MessengerThreadMessageBubble,
  MessengerThreadNotice,
} from '@/features/messenger/messenger-thread-primitives';
import { ThreadComposer } from '@/features/messenger-internal/InternalThreadParts';
import { TaskLinkedMessengerThread } from './TaskLinkedMessengerThread';
import { useCachedTaskConversationId } from './task-cached-conversation';

export interface TaskLocalMessage {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
  receiptLabel?: string | null;
  localSendKey?: string | null;
}

interface TaskSheetChatPanelProps {
  task: Task;
  messages: TaskLocalMessage[];
  composerDisabled: boolean;
  conversationId?: string | null;
  onSend: (body: string) => void;
  onDraftChange?: (value: string) => void;
}

type TimelineRow =
  | { kind: 'activity'; id: string; label: string; time: string; at: string }
  | { kind: 'note'; id: string; at: string; message: MessengerViewMessage };

export function TaskSheetChatPanel({
  task,
  messages,
  composerDisabled,
  conversationId = null,
  onSend,
  onDraftChange,
}: TaskSheetChatPanelProps) {
  const cachedConversationId = useCachedTaskConversationId(task.id);
  const linkedConversationId = conversationId ?? cachedConversationId;
  const t = useTranslations('tasks');
  const dateLocale = resolveDatePickerLocale(useLocale());
  const [draft, setDraft] = useState('');
  const activity = useMemo(
    () =>
      buildTaskActivity(task, dateLocale, {
        createdBy: t('sheet.chat.createdBy', {
          name: `${task.creator.firstName} ${task.creator.lastName}`,
        }),
        lastUpdate: t('sheet.chat.lastUpdate'),
        completed: t('sheet.chat.completed'),
      }),
    [dateLocale, t, task],
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, task.id]);

  const rows = useMemo(() => {
    const items: TimelineRow[] = [
      ...activity.map((row) => ({
        kind: 'activity' as const,
        id: row.id,
        label: row.label,
        time: row.time,
        at: row.at,
      })),
      ...messages.map((m) => ({
        kind: 'note' as const,
        id: m.id,
        at: m.createdAt,
        message: taskLocalMessageToView(m),
      })),
    ];
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const out: Array<
      | { type: 'divider'; key: string; label: string }
      | { type: 'activity'; key: string; label: string; time: string }
      | { type: 'note'; key: string; message: MessengerViewMessage }
    > = [];
    let lastDateLabel = '';
    for (const item of items) {
      const dateLabel = formatTaskChatDateLabel(
        item.at,
        dateLocale,
        t('sheet.chat.today'),
        t('sheet.chat.yesterday'),
      );
      if (dateLabel !== lastDateLabel) {
        lastDateLabel = dateLabel;
        out.push({ type: 'divider', key: `d-${dateLabel}-${item.id}`, label: dateLabel });
      }
      if (item.kind === 'activity') {
        out.push({
          type: 'activity',
          key: item.id,
          label: item.label,
          time: item.time,
        });
      } else {
        out.push({ type: 'note', key: item.id, message: item.message });
      }
    }
    return out;
  }, [activity, dateLocale, messages, t]);

  const submit = () => {
    const body = draft.trim();
    if (!body || composerDisabled) return;
    onSend(body);
    setDraft('');
  };

  const titleBlock = (
    <header className="bg-card flex h-12 w-full items-center justify-between px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ThreadAvatar title={task.title} direct={false} />
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="text-foreground truncate text-sm leading-5 font-medium">{task.title}</h2>
          <span className="border-primary/30 bg-primary/10 text-primary shrink-0 rounded-full border px-1.5 py-px text-[10px] leading-[15px]">
            Task
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <HeaderIcon label="Search" src="/messenger/sheet-header-search.svg" />
        <HeaderIcon label="Video" src="/messenger/sheet-header-video.svg" />
      </div>
    </header>
  );

  if (linkedConversationId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <TaskLinkedMessengerThread conversationId={linkedConversationId} />
      </div>
    );
  }

  return (
    <div className="dark:bg-background relative flex min-h-0 flex-1 flex-col bg-[#eef2ff]">
      <div className="border-border border-b">{titleBlock}</div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        {rows.map((row) => {
          if (row.type === 'divider') {
            return <MessengerThreadDateDivider key={row.key} label={row.label} />;
          }
          if (row.type === 'activity') {
            return <MessengerThreadNotice key={row.key} text={row.label} subText={row.time} />;
          }
          return (
            <MessengerThreadMessageBubble
              key={row.key}
              message={row.message}
              readReceiptLabel={row.message.deliveryLabel ?? null}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ThreadComposer
        sheet
        canSend={!composerDisabled}
        sendDisabled={composerDisabled || !draft.trim()}
        newMessage={draft}
        onNewMessageChange={(value) => {
          onDraftChange?.(value);
          setDraft(value);
        }}
        replyTo={null}
        onClearReply={() => undefined}
        onSend={submit}
        placeholder={t('sheet.chat.addNote')}
      />
    </div>
  );
}

function HeaderIcon({ label, src }: { label: string; src: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex items-center justify-center rounded-lg p-1.5"
    >
      <img src={src} alt="" className="dark:brightness-0 dark:invert" />
    </button>
  );
}

function taskLocalMessageToView(message: TaskLocalMessage): MessengerViewMessage {
  return {
    id: message.id,
    senderId: '',
    senderName: message.authorLabel,
    initials: initialsFromDisplayName(message.authorLabel),
    content: message.body,
    timestamp: message.createdAt,
    attachments: [],
    deliveryLabel: message.receiptLabel ?? null,
    localSendKey: message.localSendKey ?? null,
  };
}

function buildTaskActivity(
  task: Task,
  locale: string,
  labels: { createdBy: string; lastUpdate: string; completed: string },
): Array<{ id: string; label: string; time: string; at: string }> {
  const events = [
    { id: 'created', label: labels.createdBy, at: task.createdAt },
    { id: 'updated', label: labels.lastUpdate, at: task.updatedAt },
    task.completedAt ? { id: 'completed', label: labels.completed, at: task.completedAt } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; at: string }>;

  return events.map((event) => ({
    id: event.id,
    label: event.label,
    at: event.at,
    time: formatTaskSheetDateTime(event.at, locale),
  }));
}
