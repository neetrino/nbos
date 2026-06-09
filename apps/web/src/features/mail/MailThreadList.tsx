'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { MailThreadListRow } from '@/lib/api/mail';

const SENDER_COLUMN_CLASS = 'w-[7.5rem] shrink-0 truncate sm:w-36';
const DATE_COLUMN_CLASS = 'w-14 shrink-0 text-right tabular-nums sm:w-16';

function formatThreadTitle(subjectNormalized: string): string {
  const trimmed = subjectNormalized.trim();
  return trimmed.length === 0 ? '(No subject)' : trimmed;
}

function formatMailListDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function threadSenderLabel(thread: MailThreadListRow, accountEmail: string | undefined): string {
  if (thread.assignedToName) {
    return thread.assignedToName;
  }
  return accountEmail ?? 'Unknown';
}

function threadPreview(thread: MailThreadListRow, accountEmail: string | undefined): string {
  if (thread.needsBusinessLink) {
    return 'Needs business link';
  }
  if (thread.assignedToName) {
    return `Assigned · ${thread.assignedToName}`;
  }
  if (accountEmail) {
    return accountEmail;
  }
  return thread.status.replaceAll('_', ' ').toLowerCase();
}

export interface MailThreadListProps {
  threads: MailThreadListRow[];
  accountEmailById: ReadonlyMap<string, string>;
  selectedThreadId: string | null;
  selectedThreadIds: ReadonlySet<string>;
  bulkBusy: boolean;
  onOpenThread: (threadId: string) => void;
  onToggleThreadSelected: (threadId: string, checked: boolean) => void;
}

export function MailThreadList({
  threads,
  accountEmailById,
  selectedThreadId,
  selectedThreadIds,
  bulkBusy,
  onOpenThread,
  onToggleThreadSelected,
}: MailThreadListProps) {
  return (
    <ul className="divide-border divide-y">
      {threads.map((thread) => {
        const accountEmail = accountEmailById.get(thread.mailAccountId);
        const senderLabel = threadSenderLabel(thread, accountEmail);
        const subject = formatThreadTitle(thread.subjectNormalized);
        const preview = threadPreview(thread, accountEmail);
        const isSelected = selectedThreadIds.has(thread.id);
        const isActive = selectedThreadId === thread.id;

        return (
          <li
            key={thread.id}
            className={cn(
              'group flex items-center',
              isActive && 'bg-muted',
              thread.hasUnread && !isActive && 'bg-muted/30',
            )}
          >
            <div className="flex shrink-0 items-center pl-2">
              <Checkbox
                checked={isSelected}
                disabled={bulkBusy}
                onCheckedChange={(checked) => onToggleThreadSelected(thread.id, checked === true)}
                aria-label={`Select ${subject}`}
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenThread(thread.id)}
              aria-current={isActive ? 'true' : undefined}
              className="hover:bg-muted/40 focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset sm:gap-3 sm:py-2.5"
            >
              {thread.hasUnread ? (
                <span className="bg-primary size-2 shrink-0 rounded-full" aria-label="Unread" />
              ) : (
                <span className="size-2 shrink-0" aria-hidden />
              )}
              <span
                className={cn(
                  SENDER_COLUMN_CLASS,
                  thread.hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}
              >
                {senderLabel}
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className={cn(thread.hasUnread ? 'font-semibold' : 'font-normal')}>
                  {subject}
                </span>
                <span className="text-muted-foreground hidden sm:inline"> — {preview}</span>
              </span>
              <span className={cn(DATE_COLUMN_CLASS, 'text-muted-foreground text-xs')}>
                {formatMailListDate(thread.lastMessageAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
