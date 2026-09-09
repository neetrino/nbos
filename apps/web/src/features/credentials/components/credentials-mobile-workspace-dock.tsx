'use client';

import { useMemo } from 'react';
import {
  useRegisterMobileDockLayout,
  useRegisterMobileDockWorkspaceActions,
} from '@/components/layout/MobileModuleDockProvider';
import { CredentialsPageSettingsSheet } from '@/features/credentials/components/credentials-page-settings-sheet';
import type { CredentialVaultListScope } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { PermissionGate } from '@/lib/permissions';

interface CredentialsMobileWorkspaceDockProps {
  showCreate: boolean;
  onCreate: () => void;
  vaultListScope: CredentialVaultListScope;
  onVaultListScopeChange: (scope: CredentialVaultListScope) => void;
}

export function CredentialsMobileWorkspaceDock({
  showCreate,
  onCreate,
  vaultListScope,
  onVaultListScopeChange,
}: CredentialsMobileWorkspaceDockProps) {
  const create = useMemo(
    () => ({ onSelect: onCreate, disabled: !showCreate }),
    [onCreate, showCreate],
  );
  const settings = useMemo(
    () => (
      <PermissionGate module="CREDENTIALS" action="VIEW">
        <CredentialsPageSettingsSheet
          triggerVariant="dock"
          vaultListScope={vaultListScope}
          onVaultListScopeChange={onVaultListScopeChange}
        />
      </PermissionGate>
    ),
    [onVaultListScopeChange, vaultListScope],
  );

  useRegisterMobileDockLayout('workspace');
  useRegisterMobileDockWorkspaceActions({ create, settings });

  return null;
}
