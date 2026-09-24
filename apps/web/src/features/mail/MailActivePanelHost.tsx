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
import type { MailMailboxSettingsTab } from '@/features/mail/mail-mailbox-settings-tabs';
import { MailboxSettingsSheet } from '@/features/mail/MailboxSettingsSheet';
import {
  MAIL_ACCESS_SHEET_CONTENT_CLASS,
  MAIL_ACCESS_SHEET_RAIL_ANCHOR_CLASS,
  MAIL_WORKSPACE_SHEET_CONTENT_CLASS,
  MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS,
} from '@/features/mail/mail-workspace-sheet-classes';
import { MailThreadDetailPanel } from '@/features/mail/MailThreadDetailPanel';
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
  onDeleteMailbox?: (account: MailAccountHealthSummaryRow) => void;
  onComposeSent: (threadId: string) => void;
  onComposeClosed?: () => void;
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
  onDeleteMailbox,
  onComposeSent,
  onComposeClosed,
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
      if (activePanel?.type === 'compose') {
        onComposeClosed?.();
      }
    }
  };

  const closePanel = () => {
    onActivePanelChange(null);
    if (activePanel?.type === 'compose') {
      onComposeClosed?.();
    }
  };

  const sourcePageHref = threadId ? `/mail/threads/${threadId}` : '#';
  const isAccessPanel = activePanel?.type === 'share' || activePanel?.type === 'connect';
  const settingsAccountId =
    activePanel?.type === 'share'
      ? activePanel.accountId
      : activePanel?.type === 'connect'
        ? activePanel.accountId
        : undefined;
  const settingsAccount = settingsAccountId
    ? (accounts.find((account) => account.id === settingsAccountId) ?? null)
    : null;
  const settingsTab: MailMailboxSettingsTab = activePanel?.type === 'share' ? 'access' : 'general';
  const onDeleteSelectedMailbox =
    settingsAccount && onDeleteMailbox ? () => onDeleteMailbox(settingsAccount) : undefined;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout={isAccessPanel ? 'auxiliary' : 'full'}
        width="wide"
        contentClassName={
          isAccessPanel ? MAIL_ACCESS_SHEET_CONTENT_CLASS : MAIL_WORKSPACE_SHEET_CONTENT_CLASS
        }
        railAnchorClassName={
          isAccessPanel
            ? MAIL_ACCESS_SHEET_RAIL_ANCHOR_CLASS
            : MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS
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
              resumeThreadId={activePanel.resumeThreadId ?? null}
              onSent={onComposeSent}
              onClose={closePanel}
            />
          ) : null}

          {activePanel?.type === 'connect' && !settingsAccount ? (
            <ConnectMailboxSheet enabled onConnected={onMailboxConnected} onClose={closePanel} />
          ) : null}

          {settingsAccount ? (
            <MailboxSettingsSheet
              account={settingsAccount}
              initialTab={settingsTab}
              onConnected={onMailboxConnected}
              onClose={closePanel}
              onDelete={onDeleteSelectedMailbox}
            />
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
