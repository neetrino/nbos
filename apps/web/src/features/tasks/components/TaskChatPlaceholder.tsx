import { useMemo, useState } from 'react';
import { MessageCircle, SendHorizonal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';
import { TASK_SHEET_CHAT_COLUMN_CLASS } from './task-sheet-visual';

export interface TaskLocalMessage {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
}

interface TaskChatPlaceholderProps {
  task: Task;
  messages: TaskLocalMessage[];
  onSend: (body: string) => void;
}

type FeedItem =
  | { kind: 'activity'; id: string; label: string; time: string; at: string }
  | {
      kind: 'note';
      id: string;
      authorLabel: string;
      body: string;
      time: string;
      at: string;
    };

export function TaskChatPlaceholder({ task, messages, onSend }: TaskChatPlaceholderProps) {
  const [draft, setDraft] = useState('');
  const activity = useMemo(() => buildTaskActivity(task), [task]);
  const participantCount = useMemo(() => countTaskParticipants(task), [task]);

  const feed = useMemo(() => {
    const items: FeedItem[] = [
      ...activity.map((row) => ({
        kind: 'activity' as const,
        id: row.id,
        label: row.label,
        time: row.time,
        at: row.at,
      })),
      ...messages.map((message) => ({
        kind: 'note' as const,
        id: message.id,
        authorLabel: message.authorLabel,
        body: message.body,
        time: new Date(message.createdAt).toLocaleString(),
        at: message.createdAt,
      })),
    ];
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return items;
  }, [activity, messages]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  return (
    <aside className={cn(TASK_SHEET_CHAT_COLUMN_CLASS)}>
      <div
        className="via-background dark:via-background pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/50 to-indigo-100/35 dark:from-sky-950/35 dark:to-indigo-950/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden
      />

      <header className="border-border/50 relative z-10 flex items-center gap-3 border-b px-5 py-4 backdrop-blur-md">
        <span className="bg-accent/15 text-accent flex size-10 shrink-0 items-center justify-center rounded-2xl">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold tracking-tight">
            Task chat
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Users className="size-3.5 shrink-0" aria-hidden />
            <span>
              {participantCount} participant{participantCount === 1 ? '' : 's'} · {feed.length}{' '}
              timeline event{feed.length === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {feed.length === 0 ? (
            <EmptyFeed />
          ) : (
            feed.map((item) =>
              item.kind === 'activity' ? (
                <SystemTimelineRow key={item.id} label={item.label} time={item.time} />
              ) : (
                <NoteBubble
                  key={item.id}
                  authorLabel={item.authorLabel}
                  time={item.time}
                  body={item.body}
                />
              ),
            )
          )}
        </div>

        <div className="border-border/50 bg-background/80 relative z-10 border-t px-4 py-4 backdrop-blur-md sm:px-5">
          <div className="ring-border/60 bg-card focus-within:ring-accent/40 flex flex-col gap-2 rounded-2xl p-2 shadow-sm ring-1 transition-shadow focus-within:ring-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a note… (@mentions soon)"
              rows={3}
              className="border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
              }}
            />
            <div className="flex items-center justify-end gap-2 px-2 pb-1">
              <p className="text-muted-foreground mr-auto hidden text-[11px] sm:block">⌘↵ send</p>
              <Button
                type="button"
                size="icon"
                className="size-10 shrink-0 rounded-full shadow-md"
                disabled={!draft.trim()}
                onClick={submit}
                aria-label="Send note"
              >
                <SendHorizonal className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function EmptyFeed() {
  return (
    <div className="border-border/60 bg-background/60 mx-auto max-w-sm rounded-2xl border border-dashed px-5 py-8 text-center backdrop-blur-sm">
      <p className="text-foreground text-sm font-medium">No messages yet</p>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        Timeline updates and important notes will appear here in order—minimal noise, full context.
      </p>
    </div>
  );
}

function SystemTimelineRow({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex justify-center px-2">
      <div className="bg-background/85 text-muted-foreground border-border/50 max-w-lg rounded-full border px-4 py-2 text-center text-xs leading-snug shadow-sm backdrop-blur-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground"> · {time}</span>
      </div>
    </div>
  );
}

function NoteBubble({
  authorLabel,
  time,
  body,
}: {
  authorLabel: string;
  time: string;
  body: string;
}) {
  return (
    <div className="flex justify-end">
      <div className="border-border/40 from-card to-card/90 max-w-[min(100%,26rem)] rounded-2xl rounded-tr-md border bg-gradient-to-b px-4 py-3 shadow-md backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ActorAvatar label={authorLabel} />
            <p className="truncate text-sm font-semibold">{authorLabel}</p>
          </div>
          <p className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{time}</p>
        </div>
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
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

function ActorAvatar({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className="bg-accent/12 text-accent border-accent/20 flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
      {initials || 'NB'}
    </span>
  );
}
