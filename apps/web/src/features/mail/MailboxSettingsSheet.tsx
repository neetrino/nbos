'use client';

import { useState } from 'react';
import { DetailSheetTabBar, DetailSheetTabPanel } from '@/components/shared';
import type { MailAccountRow } from '@/lib/api/mail';
import { ConnectMailboxSheet } from './ConnectMailboxSheet';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';
import {
  MAIL_MAILBOX_SETTINGS_TABS,
  type MailMailboxSettingsTab,
} from './mail-mailbox-settings-tabs';
import { MAIL_SHEET_BODY_CLASS } from './mail-ui-classes';
import { ShareMailboxSheet } from './ShareMailboxSheet';

interface MailboxSettingsSheetProps {
  account: MailAccountRow;
  initialTab: MailMailboxSettingsTab;
  onConnected: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function MailboxSettingsSheet({
  account,
  initialTab,
  onConnected,
  onClose,
  onDelete,
}: MailboxSettingsSheetProps) {
  const [tab, setTab] = useState<MailMailboxSettingsTab>(initialTab);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MailSheetPanelHeader title="Settings" description={account.emailAddress} />
      <DetailSheetTabBar
        tabs={MAIL_MAILBOX_SETTINGS_TABS}
        activeTab={tab}
        onTabChange={(value) => setTab(value as MailMailboxSettingsTab)}
        className="border-border shrink-0 border-b px-5"
      />
      <div className={`${MAIL_SHEET_BODY_CLASS} overflow-y-auto`}>
        <DetailSheetTabPanel tabKey={tab}>
          {tab === 'general' ? (
            <ConnectMailboxSheet
              enabled
              embedded
              reconnectAccount={account}
              onConnected={onConnected}
              onClose={onClose}
              onDelete={onDelete}
            />
          ) : (
            <ShareMailboxSheet
              enabled
              embedded
              accountId={account.id}
              accountEmail={account.emailAddress}
            />
          )}
        </DetailSheetTabPanel>
      </div>
    </div>
  );
}
