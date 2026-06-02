'use client';

import { useEffect, useState } from 'react';
import { DetailSheetTabBar } from '@/components/shared';
import { CredentialFormSheetFields } from './credential-form-sheet-fields';
import { CredentialManualAccessPanel } from './credential-manual-access-panel';
import { CredentialSecretVersionsPanel } from './credential-secret-versions-panel';
import { CredentialSheetAuditPanel } from './credential-sheet-audit-panel';
import { useCredentialSheetAudit } from '@/features/credentials/hooks/use-credential-sheet-audit';
import { credentialInheritedAccessSummary } from '@/features/credentials/utils/credential-inherited-access-summary';
import {
  CREDENTIAL_FORM_SHEET_TABS,
  type CredentialFormSheetTab,
} from '@/features/credentials/constants/credential-form-sheet-tabs';
import type { useCredentialFormSheet } from './use-credential-form-sheet';
import type { CredentialManualGrant } from '@/lib/api/credentials';

type FormState = ReturnType<typeof useCredentialFormSheet>;

export interface CredentialFormSheetBodyProps {
  form: FormState;
  sheetOpen: boolean;
  credentialId: string | null;
  manualGrants: CredentialManualGrant[];
  manualLoading: boolean;
  onManualGrantsChange: (grants: CredentialManualGrant[]) => void;
}

export function CredentialFormSheetBody({
  form,
  sheetOpen,
  credentialId,
  manualGrants,
  manualLoading,
  onManualGrantsChange,
}: CredentialFormSheetBodyProps) {
  const isEdit = Boolean(credentialId);
  const [activeTab, setActiveTab] = useState<CredentialFormSheetTab>('general');
  const audit = useCredentialSheetAudit(credentialId, sheetOpen && activeTab === 'activity');

  useEffect(() => {
    if (sheetOpen) {
      setActiveTab('general');
    }
  }, [sheetOpen, credentialId]);

  const inheritedSummary = credentialInheritedAccessSummary(form.accessLevel, form.detail);

  if (!isEdit) {
    return (
      <div className="px-6 pb-6">
        <CredentialFormSheetFields form={form} />
      </div>
    );
  }

  return (
    <>
      <DetailSheetTabBar
        tabs={CREDENTIAL_FORM_SHEET_TABS}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as CredentialFormSheetTab)}
        className="border-border shrink-0 border-b px-6"
      />
      <div className="px-6 pt-5 pb-6">
        {activeTab === 'general' ? (
          <div className="space-y-6">
            <CredentialFormSheetFields form={form} />
            <CredentialManualAccessPanel
              grants={manualGrants}
              loading={manualLoading}
              inheritedSummary={inheritedSummary}
              onGrantsChange={onManualGrantsChange}
            />
          </div>
        ) : null}
        {activeTab === 'activity' ? (
          <CredentialSheetAuditPanel
            entries={audit.entries}
            loading={audit.loading}
            onReload={() => void audit.reload()}
            embedded
          />
        ) : null}
        {activeTab === 'secret-history' && credentialId ? (
          <CredentialSecretVersionsPanel
            credentialId={credentialId}
            sheetOpen={sheetOpen}
            embedded
          />
        ) : null}
      </div>
    </>
  );
}
