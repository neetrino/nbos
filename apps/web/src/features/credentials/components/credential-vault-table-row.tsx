'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { CredentialVaultTableRowCells } from '@/features/credentials/components/credential-vault-table-row-cells';
import {
  CredentialVaultTableActionsCell,
  CredentialVaultTableUrlCell,
} from '@/features/credentials/components/credential-vault-table-row-actions';

export interface CredentialVaultTableRowProps {
  cred: CredentialListItem;
  isArchivedList: boolean;
  isLoginVisible: boolean;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
}

export function CredentialVaultTableRow({
  cred,
  isArchivedList,
  isLoginVisible,
  onToggleLogin,
  onCopy,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: CredentialVaultTableRowProps) {
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpenCredential(cred.id)}>
      <CredentialVaultTableRowCells
        cred={cred}
        isLoginVisible={isLoginVisible}
        onToggleLogin={onToggleLogin}
        onCopy={onCopy}
      />
      <TableCell onClick={(e) => e.stopPropagation()}>
        <CredentialVaultTableUrlCell cred={cred} isArchivedList={isArchivedList} />
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <CredentialVaultTableActionsCell
          cred={cred}
          isArchivedList={isArchivedList}
          onOpenCredential={onOpenCredential}
          onRequestDelete={onRequestDelete}
          onRequestPurge={onRequestPurge}
          onRestored={onRestored}
        />
      </TableCell>
    </TableRow>
  );
}
