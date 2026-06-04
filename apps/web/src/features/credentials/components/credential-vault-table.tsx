'use client';

import { Plus, KeyRound } from 'lucide-react';
import { CredentialVaultTableRow } from '@/features/credentials/components/credential-vault-table-row';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import { credentialVaultCheckboxRevealClass } from '@/features/credentials/constants/credential-vault-selection-checkbox';

export type VaultListScope = 'active' | 'archived';

export interface CredentialVaultTableSelectionProps {
  enabled: boolean;
  selectionActive: boolean;
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  onTogglePage: () => void;
  pageIds: string[];
}

import type { CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialVaultTableProps {
  credentials: CredentialListItem[];
  loading: boolean;
  listScope: VaultListScope;
  secretFlashCredentialId: string | null;
  selection?: CredentialVaultTableSelectionProps;
  onCopyText: (text: string) => void;
  onCopySecret: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  showCreate: boolean;
}

export function CredentialVaultTable({
  credentials,
  loading,
  listScope,
  secretFlashCredentialId,
  onCopyText,
  onCopySecret,
  onCreateOpen,
  onOpenCredential,
  showCreate,
  selection,
}: CredentialVaultTableProps) {
  const isArchivedList = listScope === 'archived';
  const pageIds = selection?.pageIds ?? [];
  const allPageSelected = Boolean(
    selection?.enabled && pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id)),
  );
  const somePageSelected =
    selection?.enabled && pageIds.some((id) => selection.isSelected(id)) && !allPageSelected;
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
        action={
          showCreate ? (
            <PermissionGate module="CREDENTIALS" action="ADD">
              <Button onClick={onCreateOpen}>
                <Plus size={16} /> Add Credential
              </Button>
            </PermissionGate>
          ) : undefined
        }
      />
    );
  }

  const bulkSelectionStarted = selection?.selectionActive ?? false;

  return (
    <div className="group/vault-table border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {selection?.enabled ? (
              <TableHead className="w-10">
                <div
                  className={credentialVaultCheckboxRevealClass(
                    bulkSelectionStarted,
                    allPageSelected,
                    'group-hover/vault-table:opacity-100',
                  )}
                >
                  <CredentialVaultSelectCheckbox
                    checked={Boolean(allPageSelected)}
                    indeterminate={somePageSelected}
                    ariaLabel="Select all on page"
                    onToggle={() => selection.onTogglePage()}
                  />
                </div>
              </TableHead>
            ) : null}
            <TableHead>Name</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Rotation</TableHead>
            <TableHead>URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((cred) => (
            <CredentialVaultTableRow
              key={cred.id}
              cred={cred}
              isArchivedList={isArchivedList}
              secretFlashCredentialId={secretFlashCredentialId}
              selectionEnabled={selection?.enabled ?? false}
              selectionActive={bulkSelectionStarted}
              selected={selection?.isSelected(cred.id) ?? false}
              onToggleSelected={() => selection?.onToggle(cred.id)}
              onCopyText={onCopyText}
              onCopySecret={onCopySecret}
              onOpenCredential={onOpenCredential}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
