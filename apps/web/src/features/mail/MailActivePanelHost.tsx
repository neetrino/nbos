'use client';

import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import { ComposeMailSheet } from '@/features/mail/ComposeMailSheet';
import { ConnectMailboxSheet } from '@/features/mail/ConnectMailboxSheet';
import {
  activeMailThreadId,
  isMailPanelOpen,
  type MailOverlayPanel,
  type ActiveMailPanel,
} from '@/features/mail/mail-active-panel';
import {
  MAIL_NESTED_FORWARD_SHEET_CONTENT_CLASS,
  MAIL_NESTED_FORWARD_SHEET_RAIL_ANCHOR_CLASS,
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
  overlayPanel: MailOverlayPanel;
  onOverlayPanelChange: (panel: MailOverlayPanel) => void;
  accounts: MailAccountHealthSummaryRow[];
  canEdit: boolean;
  onThreadMarkedRead?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedUnread?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedSpam?: (threadId: string, mailAccountId: string) => void;
  onMailboxConnected: () => void;
  onComposeSent: (threadId: string) => void;
  onThreadDeleted?: (threadId: string) => void;
}

export function MailActivePanelHost({
  activePanel,
  onActivePanelChange,
  overlayPanel,
  onOverlayPanelChange,
  accounts,
  canEdit,
  onThreadMarkedRead,
  onThreadMarkedUnread,
  onThreadMarkedSpam,
  onMailboxConnected,
  onComposeSent,
  onThreadDeleted,
}: MailActivePanelHostProps) {
  const open = isMailPanelOpen(activePanel);
  const threadId = activeMailThreadId(activePanel);
  const isThreadPanel = activePanel?.type === 'thread';
  const isConnectPanel = activePanel?.type === 'connect';
  const isSharePanel = activePanel?.type === 'share';
  const isCompactPanel = isConnectPanel || isSharePanel;

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
  const closeOverlayPanel = () => {
    onOverlayPanelChange(null);
  };

  const sourcePageHref = threadId ? `/mail/threads/${threadId}` : '#';
  const usesWorkspaceShell = !isCompactPanel;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width={isCompactPanel ? 'compact' : 'wide'}
          contentClassName={usesWorkspaceShell ? MAIL_WORKSPACE_SHEET_CONTENT_CLASS : undefined}
          railAnchorClassName={
            usesWorkspaceShell ? MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS : undefined
          }
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
                  onOverlayPanelChange({
                    type: 'forward-compose',
                    threadId,
                    defaultAccountId: payload.mailAccountId,
                    defaultSubject: payload.subject,
                  })
                }
                onDeleted={onThreadDeleted}
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
      <Sheet
        open={overlayPanel?.type === 'forward-compose'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeOverlayPanel();
          }
        }}
      >
        {overlayPanel?.type === 'forward-compose' ? (
          <EntityDetailSheetContent
            open
            layout="full"
            width="wide"
            forceNestedBackdrop
            contentClassName={MAIL_NESTED_FORWARD_SHEET_CONTENT_CLASS}
            railAnchorClassName={MAIL_NESTED_FORWARD_SHEET_RAIL_ANCHOR_CLASS}
            showRailActions={false}
            sourcePageHref={sourcePageHref}
            className="gap-0"
          >
            <ComposeMailSheet
              enabled
              accounts={accounts}
              defaultAccountId={overlayPanel.defaultAccountId}
              mode="forward"
              defaultSubject={overlayPanel.defaultSubject ?? ''}
              onSent={() => closeOverlayPanel()}
              onClose={closeOverlayPanel}
            />
          </EntityDetailSheetContent>
        ) : null}
      </Sheet>
    </>
  );
}
