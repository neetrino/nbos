import { useEffect, useMemo, useRef, useState } from 'react';
import { Hash } from 'lucide-react';
import type { Task } from '@/lib/api/tasks';
import { messengerDateLabel } from '@/features/messenger/messenger-format';
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
  const [draft, setDraft] = useState('');
  const activity = useMemo(() => buildTaskActivity(task), [task]);
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
      const dateLabel = messengerDateLabel(item.at);
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
  }, [activity, messages]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
        <Hash size={18} className={MESSENGER_THREAD_HASH_ICON_CLASS} aria-hidden />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-black">Task chat</h2>
          <p className="text-xs text-black/40">
            {participantCount} participant{participantCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

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
          placeholder="Add a note…"
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
): Array<{ id: string; label: string; time: string; at: string }> {
  const events = [
    {
      id: 'created',
      label: `Created by ${task.creator.firstName} ${task.creator.lastName}`,
      at: task.createdAt,
    },
    {
      id: 'updated',
      label: 'Last update on the card',
      at: task.updatedAt,
    },
    task.completedAt
      ? {
          id: 'completed',
          label: 'Task marked completed',
          at: task.completedAt,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; at: string }>;

  return events.map((event) => ({
    id: event.id,
    label: event.label,
    at: event.at,
    time: new Date(event.at).toLocaleString(),
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
