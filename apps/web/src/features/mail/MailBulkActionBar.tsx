'use client';

import { MailCheck, MailOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MailBulkActionBarProps {
  visibleThreadCount: number;
  selectedCount: number;
  allVisibleSelected: boolean;
  busy: boolean;
  canMarkUnread: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function MailBulkActionBar({
  visibleThreadCount,
  selectedCount,
  allVisibleSelected,
  busy,
  canMarkUnread,
  onToggleSelectAll,
  onMarkRead,
  onMarkUnread,
  onClearSelection,
  className,
}: MailBulkActionBarProps) {
  if (visibleThreadCount === 0) {
    return null;
  }

  const selectAllChecked = allVisibleSelected;

  return (
    <div
      className={cn(
        'border-border flex flex-wrap items-center gap-2 border-b px-3 py-2',
        className,
      )}
    >
      <Checkbox
        checked={selectAllChecked}
        onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
        disabled={busy}
        aria-label="Select all threads on this page"
      />
      {selectedCount > 0 ? (
        <>
          <span className="text-sm font-medium tabular-nums">{selectedCount} selected</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onMarkRead()}
          >
            <MailOpen size={14} aria-hidden />
            Mark read
          </Button>
          {canMarkUnread ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onMarkUnread()}
            >
              <MailCheck size={14} aria-hidden />
              Mark unread
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onClearSelection()}
          >
            <X size={14} aria-hidden />
            Clear
          </Button>
        </>
      ) : (
        <span className="text-muted-foreground text-sm">Select threads for bulk actions</span>
      )}
    </div>
  );
}
