'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { MailThreadDetailContent } from '@/features/mail/MailThreadDetailContent';
import type { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';

export interface MailThreadDetailPanelProps {
  threadId: string;
  canEdit: boolean;
  detailState: ReturnType<typeof useMailThreadDetail>;
  compact?: boolean;
  onForward?: (payload: { mailAccountId: string; subject: string }) => void;
  onDeleted?: (threadId: string) => void;
  onRestored?: (threadId: string) => void;
  trashView?: boolean;
}

export function MailThreadDetailPanel({
  threadId,
  canEdit,
  detailState,
  compact = true,
  onForward,
  onDeleted,
  onRestored,
  trashView,
}: MailThreadDetailPanelProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="px-5 py-4">
        <MailThreadDetailContent
          threadId={threadId}
          canEdit={canEdit}
          detailState={detailState}
          compact={compact}
          onForward={onForward}
          onDeleted={onDeleted}
          onRestored={onRestored}
          trashView={trashView}
        />
      </div>
    </ScrollArea>
  );
}
