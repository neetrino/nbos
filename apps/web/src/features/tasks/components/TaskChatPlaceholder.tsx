import { useMemo, useState } from 'react';
import { Activity, NotebookPen, SendHorizonal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/lib/api/tasks';

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

export function TaskChatPlaceholder({ task, messages, onSend }: TaskChatPlaceholderProps) {
  const [draft, setDraft] = useState('');
  const activity = useMemo(() => buildTaskActivity(task), [task]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  return (
    <aside className="border-border bg-muted/20 flex min-h-[360px] flex-col border-t xl:w-[25rem] xl:border-t-0 xl:border-l 2xl:w-[28rem]">
      <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <NotebookPen size={16} />
          <div>
            <p className="text-sm font-medium">Key Notes</p>
            <p className="text-muted-foreground text-xs">
              {messages.length} notes · {activity.length} recent events
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-muted-foreground" />
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Recent Activity
            </p>
          </div>
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3">
                <ActorAvatar label={item.actorLabel} />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-muted-foreground" />
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Important Notes
            </p>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="bg-background border-border rounded-xl border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <ActorAvatar label={message.authorLabel} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{message.authorLabel}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-border bg-background rounded-xl border border-dashed px-4 py-5">
              <p className="text-sm font-medium">No important notes yet.</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Keep only short operational notes worth remembering.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="border-border bg-background border-t p-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add only an important note..."
          rows={4}
          className="min-h-[96px] resize-none rounded-xl text-sm"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" disabled={!draft.trim()} onClick={submit}>
            <SendHorizonal size={14} /> Add Note
          </Button>
        </div>
      </div>
    </aside>
  );
}

function buildTaskActivity(
  task: Task,
): Array<{ id: string; actorLabel: string; label: string; time: string }> {
  const events = [
    {
      id: 'created',
      actorLabel: `${task.creator.firstName} ${task.creator.lastName}`,
      label: `Created by ${task.creator.firstName} ${task.creator.lastName}`,
      at: task.createdAt,
    },
    {
      id: 'updated',
      actorLabel: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'NBOS',
      label: 'Last update on the card',
      at: task.updatedAt,
    },
    task.completedAt
      ? {
          id: 'completed',
          actorLabel: task.assignee
            ? `${task.assignee.firstName} ${task.assignee.lastName}`
            : `${task.creator.firstName} ${task.creator.lastName}`,
          label: 'Task marked completed',
          at: task.completedAt,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; actorLabel: string; label: string; at: string }>;

  return events.map((event) => ({
    id: event.id,
    actorLabel: event.actorLabel,
    label: event.label,
    time: new Date(event.at).toLocaleString(),
  }));
}

function ActorAvatar({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className="bg-primary/10 text-primary border-primary/15 flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
      {initials || 'NB'}
    </span>
  );
}
