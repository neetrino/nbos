import { useMemo, useState } from 'react';
import { Activity, MessageSquare, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/lib/api/tasks';

export interface TaskLocalMessage {
  id: string;
  body: string;
  createdAt: string;
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
    <aside className="border-border bg-muted/20 flex min-h-[360px] flex-col border-t xl:w-80 xl:border-t-0 xl:border-l">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <div>
            <p className="text-sm font-medium">Task Chat</p>
            <p className="text-muted-foreground text-xs">
              {messages.length} notes · {activity.length} events
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {activity.map((item) => (
          <div key={item.id} className="flex gap-2 text-xs">
            <span className="bg-background border-border mt-0.5 flex size-6 items-center justify-center rounded-full border">
              <Activity size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-foreground">{item.label}</p>
              <p className="text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}

        {messages.map((message) => (
          <div key={message.id} className="bg-background border-border rounded-lg border p-3">
            <p className="text-sm whitespace-pre-wrap">{message.body}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="border-border bg-background border-t p-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task note..."
          rows={3}
          className="min-h-[76px] resize-none text-sm"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" disabled={!draft.trim()} onClick={submit}>
            <SendHorizonal size={14} /> Send
          </Button>
        </div>
      </div>
    </aside>
  );
}

function buildTaskActivity(task: Task): Array<{ id: string; label: string; time: string }> {
  const events = [
    {
      id: 'created',
      label: `Created by ${task.creator.firstName} ${task.creator.lastName}`,
      at: task.createdAt,
    },
    { id: 'updated', label: 'Last updated', at: task.updatedAt },
    task.completedAt ? { id: 'completed', label: 'Completed', at: task.completedAt } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; at: string }>;

  return events.map((event) => ({
    id: event.id,
    label: event.label,
    time: new Date(event.at).toLocaleString(),
  }));
}
