'use client';

import { Plus, KeyRound } from 'lucide-react';
import { CredentialVaultTableRow } from '@/features/credentials/components/credential-vault-table-row';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

export type VaultListScope = 'active' | 'archived';

export interface CredentialVaultTableProps {
  credentials: CredentialListItem[];
  loading: boolean;
  listScope: VaultListScope;
  visibleLogins: Set<string>;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
  showCreate: boolean;
}

export function CredentialVaultTable({
  credentials,
  loading,
  listScope,
  visibleLogins,
  onToggleLogin,
  onCopy,
  onCreateOpen,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
  showCreate,
}: CredentialVaultTableProps) {
  const isArchivedList = listScope === 'archived';
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

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Rotation</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-28 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((cred) => (
            <CredentialVaultTableRow
              key={cred.id}
              cred={cred}
              isArchivedList={isArchivedList}
              isLoginVisible={visibleLogins.has(cred.id)}
              onToggleLogin={onToggleLogin}
              onCopy={onCopy}
              onOpenCredential={onOpenCredential}
              onRequestDelete={onRequestDelete}
              onRequestPurge={onRequestPurge}
              onRestored={onRestored}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
