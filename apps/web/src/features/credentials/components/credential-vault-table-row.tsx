'use client';

import { TableRow, TableCell } from '@/components/ui/table';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
} from '@/components/shared/entity-list-table';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { CredentialVaultTableRowCells } from '@/features/credentials/components/credential-vault-table-row-cells';
import { CredentialVaultTableUrlCell } from '@/features/credentials/components/credential-vault-table-row-actions';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import {
  credentialVaultCheckboxRevealClass,
  isCredentialVaultCheckboxTarget,
} from '@/features/credentials/constants/credential-vault-selection-checkbox';
import type { CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialVaultTableRowProps {
  cred: CredentialListItem;
  isTrashList: boolean;
  secretFlashCredentialId: string | null;
  selectionEnabled: boolean;
  selectionActive: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onCopyText: (text: string) => void;
  onCopySecret: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
}

export function CredentialVaultTableRow({
  cred,
  isTrashList,
  secretFlashCredentialId,
  selectionEnabled,
  selectionActive,
  selected,
  onToggleSelected,
  onCopyText,
  onCopySecret,
  onOpenCredential,
  onSetFavorite,
}: CredentialVaultTableRowProps) {
  return (
    <TableRow
      className={`group cursor-pointer ${ENTITY_LIST_ROW_HOVER_CLASS}`}
      onClick={(event) => {
        if (isCredentialVaultCheckboxTarget(event.target)) return;
        onOpenCredential(cred.id);
      }}
    >
      {selectionEnabled ? (
        <TableCell
          className={`${ENTITY_LIST_CELL_CLASS} w-10`}
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
        secretFlashCredentialId={secretFlashCredentialId}
        onCopyText={onCopyText}
        onCopySecret={onCopySecret}
        onSetFavorite={onSetFavorite}
      />
      <TableCell className={ENTITY_LIST_CELL_CLASS} onClick={(e) => e.stopPropagation()}>
        <CredentialVaultTableUrlCell cred={cred} isTrashList={isTrashList} />
      </TableCell>
    </TableRow>
  );
}
