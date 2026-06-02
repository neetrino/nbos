'use client';

import { CredentialManualAccessPanel } from './credential-manual-access-panel';
import { CredentialSecretVersionsPanel } from './credential-secret-versions-panel';
import { CredentialSheetAuditPanel } from './credential-sheet-audit-panel';
import { useCredentialManualAccess } from '@/features/credentials/hooks/use-credential-manual-access';
import { useCredentialSheetAudit } from '@/features/credentials/hooks/use-credential-sheet-audit';
import { credentialInheritedAccessSummary } from '@/features/credentials/utils/credential-inherited-access-summary';
import type { CredentialDetail } from '@/lib/api/credentials';

export interface CredentialFormSheetPanelsProps {
  sheetOpen: boolean;
  credentialId: string | null;
  accessLevel: string;
  detail: CredentialDetail | null;
}

export function CredentialFormSheetPanels({
  sheetOpen,
  credentialId,
  accessLevel,
  detail,
}: CredentialFormSheetPanelsProps) {
  const manual = useCredentialManualAccess(credentialId, sheetOpen);
  const audit = useCredentialSheetAudit(credentialId, sheetOpen);

  if (!credentialId) return null;

  const inheritedSummary = credentialInheritedAccessSummary(accessLevel, detail);

  return (
    <div className="space-y-0 px-6 pb-6">
      <CredentialManualAccessPanel
        grants={manual.grants}
        employees={manual.employees}
        loading={manual.loading}
        saving={manual.saving}
        inheritedSummary={inheritedSummary}
        onGrantsChange={manual.setGrants}
        onSave={() => void manual.save()}
        showSave
      />
      <CredentialSecretVersionsPanel credentialId={credentialId} sheetOpen={sheetOpen} />
      <CredentialSheetAuditPanel
        entries={audit.entries}
        loading={audit.loading}
        onReload={() => void audit.reload()}
      />
    </div>
  );
}
