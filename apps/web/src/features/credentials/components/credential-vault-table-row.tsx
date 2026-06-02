'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { CredentialVaultTableRowCells } from '@/features/credentials/components/credential-vault-table-row-cells';
import {
  CredentialVaultTableActionsCell,
  CredentialVaultTableUrlCell,
} from '@/features/credentials/components/credential-vault-table-row-actions';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import {
  credentialVaultCheckboxRevealClass,
  isCredentialVaultCheckboxTarget,
} from '@/features/credentials/constants/credential-vault-selection-checkbox';

export interface CredentialVaultTableRowProps {
  cred: CredentialListItem;
  isArchivedList: boolean;
  isLoginVisible: boolean;
  selectionEnabled: boolean;
  selectionActive: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string, criticality: string) => void;
  onRestored: () => void;
}

export function CredentialVaultTableRow({
  cred,
  isArchivedList,
  isLoginVisible,
  selectionEnabled,
  selectionActive,
  selected,
  onToggleSelected,
  onToggleLogin,
  onCopy,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: CredentialVaultTableRowProps) {
  return (
    <TableRow
      className="group cursor-pointer"
      onClick={(event) => {
        if (isCredentialVaultCheckboxTarget(event.target)) return;
        onOpenCredential(cred.id);
      }}
    >
      {selectionEnabled ? (
        <TableCell
          className="w-10"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={credentialVaultCheckboxRevealClass(
              selectionActive,
              selected,
              'group-hover:opacity-100',
            )}
          >
            <CredentialVaultSelectCheckbox
              checked={selected}
              ariaLabel={`Select ${cred.name}`}
              onToggle={onToggleSelected}
            />
          </div>
        </TableCell>
      ) : null}
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
