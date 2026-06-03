'use client';

import { FolderKanban, KeyRound, Shield } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { CredentialVaultPreviewStrip } from '@/features/credentials/components/credential-vault-preview-strip';
import { buildCredentialVaultPreview } from '@/features/credentials/utils/credential-vault-preview';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialHealthBadge } from '@/features/credentials/utils/credential-health-badge';
import { formatCredentialTypeLabel } from '@/features/credentials/utils/credential-type-display';
import type { CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialVaultTableRowCellsProps {
  cred: CredentialListItem;
  secretFlashCredentialId: string | null;
  onCopyText: (text: string) => void;
  onCopySecret: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
}

function previewCellFallback(cred: CredentialListItem, itemIndex: number) {
  const model = buildCredentialVaultPreview(cred);
  if (model.infoOnly && itemIndex === 0) {
    return <CredentialVaultPreviewStrip credential={cred} itemIndex={0} />;
  }
  return <span className="text-muted-foreground text-sm">—</span>;
}

export function CredentialVaultTableRowCells({
  cred,
  secretFlashCredentialId,
  onCopyText,
  onCopySecret,
}: CredentialVaultTableRowCellsProps) {
  const access = getAccessLevel(cred.accessLevel);
  const criticality = getCredentialCriticality(cred.criticality);
  const healthBadge = credentialHealthBadge(cred.health);
  const preview = buildCredentialVaultPreview(cred);

  const renderPreviewCell = (itemIndex: number) => {
    const item = preview.items[itemIndex];
    if (!item) {
      return previewCellFallback(cred, itemIndex);
    }
    if (item.type === 'info') {
      return itemIndex === 0 ? (
        <CredentialVaultPreviewStrip
          credential={cred}
          onCopyText={onCopyText}
          onCopySecret={onCopySecret}
          itemIndex={0}
        />
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    }
    return (
      <CredentialVaultPreviewStrip
        credential={cred}
        secretFlashCredentialId={secretFlashCredentialId}
        onCopyText={onCopyText}
        onCopySecret={onCopySecret}
        itemIndex={itemIndex}
      />
    );
  };

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          <span className="font-medium">{cred.name}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[180px]" onClick={(e) => e.stopPropagation()}>
        {renderPreviewCell(0)}
      </TableCell>
      <TableCell className="max-w-[140px]" onClick={(e) => e.stopPropagation()}>
        {renderPreviewCell(1)}
      </TableCell>
      <TableCell className="text-xs">{cred.category}</TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatCredentialTypeLabel(cred.credentialType)}
      </TableCell>
      <TableCell>
        {criticality && <StatusBadge label={criticality.label} variant={criticality.variant} />}
      </TableCell>
      <TableCell>
        {access && (
          <div className="flex items-center gap-1">
            <Shield size={11} className="text-muted-foreground" />
            <StatusBadge label={access.label} variant={access.variant} />
          </div>
        )}
      </TableCell>
      <TableCell>
        {cred.project ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <FolderKanban size={10} />
            {cred.project.name}
          </div>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">
            {cred.nextRotationAt ? new Date(cred.nextRotationAt).toLocaleDateString() : 'No date'}
          </span>
          {healthBadge && <StatusBadge label={healthBadge.label} variant={healthBadge.variant} />}
        </div>
      </TableCell>
    </>
  );
}
