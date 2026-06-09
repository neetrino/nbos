'use client';

import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import { MailThreadDetailPanel } from '@/features/mail/MailThreadDetailPanel';
import { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';

export interface MailThreadDetailSheetProps {
  threadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onThreadMarkedRead?: (threadId: string, mailAccountId: string) => void;
  onClosed?: () => void;
}

export function MailThreadDetailSheet({
  threadId,
  open,
  onOpenChange,
  canEdit,
  onThreadMarkedRead,
  onClosed,
}: MailThreadDetailSheetProps) {
  const detailState = useMailThreadDetail({
    threadId: threadId ?? '',
    enabled: open && Boolean(threadId),
    onThreadMarkedRead,
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      onClosed?.();
    }
  };

  const sourcePageHref = threadId ? `/mail/threads/${threadId}` : '#';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="medium"
        showRailActions={Boolean(threadId)}
        sourcePageHref={sourcePageHref}
      >
        <div className="flex h-full min-h-0 flex-col">
          {threadId ? (
            <MailThreadDetailPanel
              threadId={threadId}
              canEdit={canEdit}
              detailState={detailState}
            />
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
