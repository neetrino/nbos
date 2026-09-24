'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { MailThreadListRow } from '@/lib/api/mail';
import { formatMailListDate, mailInitialsFromLabel } from './mail-format';
import {
  MAIL_AVATAR_CLASS,
  MAIL_THREAD_MAILBOX_LABEL_CLASS,
  MAIL_THREAD_ROW_ACTIVE_CLASS,
  MAIL_THREAD_ROW_CLASS,
  MAIL_THREAD_ROW_UNREAD_CLASS,
} from './mail-ui-classes';

function formatThreadTitle(subjectNormalized: string): string {
  const trimmed = subjectNormalized.trim();
  return trimmed.length === 0 ? '(No subject)' : trimmed;
}

function threadSenderLabel(thread: MailThreadListRow): string {
  const named = thread.counterpartDisplayName?.trim();
  if (named) {
    return named;
  }
  if (thread.counterpartEmail) {
    return thread.counterpartEmail;
  }
  return 'Unknown';
}

/** Left-side meta under subject: sender email only (+ status when useful). */
function threadSenderMeta(thread: MailThreadListRow): string | null {
  const senderEmail = thread.counterpartEmail?.trim() || null;
  if (senderEmail) {
    return senderEmail;
  }
  if (thread.needsBusinessLink) {
    return 'Needs business link';
  }
  if (thread.assignedToName) {
    return `Assigned · ${thread.assignedToName}`;
  }
  return null;
}

export interface MailThreadListProps {
  threads: MailThreadListRow[];
  accountEmailById: ReadonlyMap<string, string>;
  selectedThreadId: string | null;
  selectedThreadIds: ReadonlySet<string>;
  onOpenThread: (threadId: string) => void;
  onToggleThreadSelected: (threadId: string, checked: boolean) => void;
}

export function MailThreadList({
  threads,
  accountEmailById,
  selectedThreadId,
  selectedThreadIds,
  onOpenThread,
  onToggleThreadSelected,
}: MailThreadListProps) {
  return (
    <ul className="divide-border divide-y">
      {threads.map((thread) => {
        const accountEmail = accountEmailById.get(thread.mailAccountId);
        const senderLabel = threadSenderLabel(thread);
        const subject = formatThreadTitle(thread.subjectNormalized);
        const senderMeta = threadSenderMeta(thread);
        const isSelected = selectedThreadIds.has(thread.id);
        const isActive = selectedThreadId === thread.id;

        return (
          <li
            key={thread.id}
            className={cn(
              MAIL_THREAD_ROW_CLASS,
              isActive && MAIL_THREAD_ROW_ACTIVE_CLASS,
              thread.hasUnread && !isActive && MAIL_THREAD_ROW_UNREAD_CLASS,
            )}
          >
            <div className="flex shrink-0 items-center pl-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onToggleThreadSelected(thread.id, checked === true)}
                aria-label={`Select ${subject}`}
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenThread(thread.id)}
              aria-current={isActive ? 'true' : undefined}
              className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <span className={cn(MAIL_AVATAR_CLASS, thread.hasUnread && 'ring-primary ring-2')}>
                {mailInitialsFromLabel(senderLabel)}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-sm',
                    thread.hasUnread ? 'text-foreground font-semibold' : 'text-foreground/80',
                  )}
                >
                  {senderLabel}
                </span>
                <span
                  className={cn(
                    'block truncate text-sm',
                    thread.hasUnread ? 'font-medium' : 'font-normal',
                  )}
                >
                  {subject}
                </span>
                {senderMeta ? (
                  <span className="text-muted-foreground block truncate text-xs">{senderMeta}</span>
                ) : null}
              </span>
              {accountEmail ? (
                <Badge
                  variant="secondary"
                  title={accountEmail}
                  className={MAIL_THREAD_MAILBOX_LABEL_CLASS}
                >
                  {accountEmail}
                </Badge>
              ) : null}
              <span className="text-muted-foreground shrink-0 self-start pt-0.5 text-xs tabular-nums">
                {formatMailListDate(thread.lastMessageAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
