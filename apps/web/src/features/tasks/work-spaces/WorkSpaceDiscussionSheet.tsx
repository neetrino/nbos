'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { EntityConversationPanel } from '@/features/messenger-internal/EntityConversationPanel';
import { cn } from '@/lib/utils';

const DISCUSSION_SHEET_WIDTH_CLASS = 'sm:data-[side=right]:w-[min(92vw,40rem)]';
const DISCUSSION_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[min(92vw,40rem)]';

export function WorkSpaceDiscussionSheet({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        contentClassName={cn(
          'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none',
          DISCUSSION_SHEET_WIDTH_CLASS,
        )}
        railAnchorClassName={DISCUSSION_RAIL_ANCHOR_CLASS}
        showRailActions={false}
      >
        <header className="border-border bg-background shrink-0 border-b px-5 pt-4 pb-3">
          <p className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0.5')}>Discussion</p>
          <h2 className="text-foreground truncate text-lg font-semibold tracking-tight">
            {workspaceName}
          </h2>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {open ? <EntityConversationPanel kind="workspace" entityId={workspaceId} /> : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}

export function WorkSpaceDiscussionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <MessageSquare size={16} aria-hidden />
      Discussion
    </Button>
  );
}
