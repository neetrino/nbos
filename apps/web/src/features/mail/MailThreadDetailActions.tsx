'use client';

import {
  Check,
  Forward,
  MailOpen,
  Reply,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';

export interface MailThreadDetailActionsProps {
  layout: 'settings' | 'buttons';
  isTrashView: boolean;
  hasUnread: boolean;
  isSpam: boolean;
  actionsBusy: boolean;
  deleting: boolean;
  onReply: () => void;
  onForward: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onMarkSpam: () => void;
  onMoveToTrash: () => void;
  onRestore: () => void;
  onDeletePermanently: () => void;
}

/** Thread actions — settings overflow on mobile sheet, button row on desktop. */
export function MailThreadDetailActions({
  layout,
  isTrashView,
  hasUnread,
  isSpam,
  actionsBusy,
  deleting,
  onReply,
  onForward,
  onMarkRead,
  onMarkUnread,
  onMarkSpam,
  onMoveToTrash,
  onRestore,
  onDeletePermanently,
}: MailThreadDetailActionsProps) {
  if (layout === 'settings') {
    return (
      <DetailSheetSettingsMenu>
        {isTrashView ? (
          <>
            <DropdownMenuItem disabled={actionsBusy} onClick={onRestore}>
              <RotateCcw />
              Restore
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={actionsBusy}
              onClick={onDeletePermanently}
            >
              <Trash2 />
              Delete permanently
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={onReply}>
              <Reply />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onForward}>
              <Forward />
              Forward
            </DropdownMenuItem>
            {hasUnread ? (
              <DropdownMenuItem disabled={actionsBusy} onClick={onMarkRead}>
                <Check />
                Mark read
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled={actionsBusy} onClick={onMarkUnread}>
                <MailOpen />
                Mark as unread
              </DropdownMenuItem>
            )}
            {!isSpam ? (
              <DropdownMenuItem disabled={actionsBusy} onClick={onMarkSpam}>
                <ShieldAlert />
                Spam
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              disabled={deleting}
              onClick={onMoveToTrash}
            >
              <Trash2 />
              Move to Trash
            </DropdownMenuItem>
          </>
        )}
      </DetailSheetSettingsMenu>
    );
  }

  if (isTrashView) {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={actionsBusy}
          onClick={onRestore}
        >
          <RotateCcw size={16} aria-hidden />
          Restore
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="text-destructive hover:text-destructive gap-2"
          disabled={actionsBusy}
          onClick={onDeletePermanently}
        >
          <Trash2 size={16} aria-hidden />
          Delete permanently
        </Button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="lg" className="gap-2" onClick={onReply}>
        <Reply size={16} aria-hidden />
        Reply
      </Button>
      <Button type="button" variant="outline" size="lg" className="gap-2" onClick={onForward}>
        <Forward size={16} aria-hidden />
        Forward
      </Button>
      {!hasUnread ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={actionsBusy}
          onClick={onMarkUnread}
        >
          <MailOpen size={16} aria-hidden />
          Mark as unread
        </Button>
      ) : null}
      {!isSpam ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={actionsBusy}
          onClick={onMarkSpam}
        >
          <ShieldAlert size={16} aria-hidden />
          Spam
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="text-destructive hover:text-destructive gap-2"
        disabled={deleting}
        onClick={onMoveToTrash}
      >
        <Trash2 size={16} aria-hidden />
        Move to Trash
      </Button>
    </div>
  );
}
