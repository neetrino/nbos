'use client';

import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import { ComposeMailSheet } from '@/features/mail/ComposeMailSheet';
import { ConnectMailboxSheet } from '@/features/mail/ConnectMailboxSheet';
import {
  activeMailThreadId,
  isMailPanelOpen,
  type ActiveMailPanel,
} from '@/features/mail/mail-active-panel';
import {
  MAIL_WORKSPACE_SHEET_CONTENT_CLASS,
  MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS,
} from '@/features/mail/mail-workspace-sheet-classes';
import { MailThreadDetailPanel } from '@/features/mail/MailThreadDetailPanel';
import { ShareMailboxSheet } from '@/features/mail/ShareMailboxSheet';
import { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';

export interface MailActivePanelHostProps {
  activePanel: ActiveMailPanel;
  onActivePanelChange: (panel: ActiveMailPanel) => void;
  accounts: MailAccountHealthSummaryRow[];
  canEdit: boolean;
  onThreadMarkedRead?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedUnread?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedSpam?: (threadId: string, mailAccountId: string) => void;
  onMailboxConnected: () => void;
  onComposeSent: (threadId: string) => void;
  onThreadDeleted?: (threadId: string) => void;
  onThreadRestored?: (threadId: string) => void;
  trashView?: boolean;
}

export function MailActivePanelHost({
  activePanel,
  onActivePanelChange,
  accounts,
  canEdit,
  onThreadMarkedRead,
  onThreadMarkedUnread,
  onThreadMarkedSpam,
  onMailboxConnected,
  onComposeSent,
  onThreadDeleted,
  onThreadRestored,
  trashView = false,
}: MailActivePanelHostProps) {
  const open = isMailPanelOpen(activePanel);
  const threadId = activeMailThreadId(activePanel);
  const isThreadPanel = activePanel?.type === 'thread';

  const detailState = useMailThreadDetail({
    threadId: threadId ?? '',
    enabled: open && isThreadPanel,
    onThreadMarkedRead,
    onThreadMarkedUnread,
    onThreadMarkedSpam,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onActivePanelChange(null);
    }
  };

  const closePanel = () => {
    onActivePanelChange(null);
  };

  const sourcePageHref = threadId ? `/mail/threads/${threadId}` : '#';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="wide"
        contentClassName={MAIL_WORKSPACE_SHEET_CONTENT_CLASS}
        railAnchorClassName={MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS}
        showRailActions={isThreadPanel}
        sourcePageHref={sourcePageHref}
        className="gap-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          {activePanel?.type === 'thread' && threadId ? (
            <MailThreadDetailPanel
              threadId={threadId}
              canEdit={canEdit}
              detailState={detailState}
              onForward={(payload) =>
                onActivePanelChange({
                  type: 'compose',
                  defaultAccountId: payload.mailAccountId,
                  mode: 'forward',
                  defaultSubject: payload.subject,
                })
              }
              onDeleted={onThreadDeleted}
              onRestored={onThreadRestored}
              trashView={trashView}
            />
          ) : null}

          {activePanel?.type === 'compose' ? (
            <ComposeMailSheet
              enabled
              accounts={accounts}
              defaultAccountId={activePanel.defaultAccountId}
              mode={activePanel.mode ?? 'new'}
              defaultSubject={activePanel.defaultSubject ?? ''}
              onSent={onComposeSent}
              onClose={closePanel}
            />
          ) : null}

          {activePanel?.type === 'connect' ? (
            <ConnectMailboxSheet enabled onConnected={onMailboxConnected} onClose={closePanel} />
          ) : null}

          {activePanel?.type === 'share' ? (
            <ShareMailboxSheet
              enabled
              accountId={activePanel.accountId}
              accountEmail={activePanel.accountEmail}
            />
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
