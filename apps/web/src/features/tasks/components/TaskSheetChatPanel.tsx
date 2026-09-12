import { useEffect, useMemo, useRef, useState } from 'react';
import { Hash } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import type { Task } from '@/lib/api/tasks';
import { formatTaskChatDateLabel, formatTaskSheetDateTime } from './task-sheet-format';
import {
  initialsFromDisplayName,
  type MessengerViewMessage,
} from '@/features/messenger/messenger-message-mapper';
import { MESSENGER_THREAD_HASH_ICON_CLASS } from '@/features/messenger/messenger-thread-ui.constants';
import {
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
  MessengerThreadMessageBubble,
  MessengerThreadNotice,
} from '@/features/messenger/messenger-thread-primitives';
import { DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS } from '@/components/shared/detail-sheet-classes';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';

export interface TaskLocalMessage {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
}

interface TaskSheetChatPanelProps {
  task: Task;
  messages: TaskLocalMessage[];
  onSend: (body: string) => void;
}

type TimelineRow =
  | { kind: 'activity'; id: string; label: string; time: string; at: string }
  | { kind: 'note'; id: string; at: string; message: MessengerViewMessage };

export function TaskSheetChatPanel({ task, messages, onSend }: TaskSheetChatPanelProps) {
  const t = useTranslations('tasks');
  const dateLocale = resolveDatePickerLocale(useLocale());
  const isMobileViewport = useIsMobileViewport();
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
  const participantCount = useMemo(() => countTaskParticipants(task), [task]);
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
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  const titleBlock = (
    <>
      <Hash size={18} className={MESSENGER_THREAD_HASH_ICON_CLASS} aria-hidden />
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-black">{t('sheet.openChat')}</h2>
        <p className="text-xs text-black/40">
          {t('sheet.chat.participants', { count: participantCount })}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isMobileViewport ? (
        <div
          className={cn(
            DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
            'mt-4 justify-start gap-3 border-b border-black/[0.06] pb-4',
          )}
        >
          {/* Clears floating Back (`left-4` + `size-9`) so the title sits to its right. */}
          <span className="size-9 shrink-0" aria-hidden />
          {titleBlock}
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          {titleBlock}
        </div>
      )}

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
              readReceiptLabel={null}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-black/[0.06] px-5 py-3">
        <MessengerThreadComposerRow
          value={draft}
          onChange={setDraft}
          onSend={submit}
          placeholder={t('sheet.chat.addNote')}
          disabled={false}
          sendDisabled={!draft.trim()}
        />
      </div>
    </div>
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
    task.completedAt
      ? { id: 'completed', label: labels.completed, at: task.completedAt }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; at: string }>;

  return events.map((event) => ({
    id: event.id,
    label: event.label,
    at: event.at,
    time: formatTaskSheetDateTime(event.at, locale),
  }));
}

function countTaskParticipants(task: Task): number {
  const ids = new Set<string>();
  ids.add(task.creator.id);
  if (task.assignee) ids.add(task.assignee.id);
  task.coAssignees.forEach((id) => ids.add(id));
  task.observers.forEach((id) => ids.add(id));
  return ids.size;
}
