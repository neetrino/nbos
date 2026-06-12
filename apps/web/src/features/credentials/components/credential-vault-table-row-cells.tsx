'use client';

import { FolderKanban, KeyRound, Star } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAccessLevel } from '@/features/credentials/constants/credentials';
import {
  buildCredentialVaultCardMetaBadges,
  resolvePrimaryCredentialFolder,
} from '@/features/credentials/utils/credential-vault-card-meta';
import { CredentialVaultMetaBadge } from '@/features/credentials/components/credential-vault-card-meta-row';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
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
  onSetFavorite?: (credentialId: string, favorite: boolean) => void;
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
  onSetFavorite,
}: CredentialVaultTableRowCellsProps) {
  const access = getAccessLevel(cred.accessLevel);
  const category = getCredentialCategoryMeta(cred.category);
  const metaBadges = buildCredentialVaultCardMetaBadges(cred);
  const categoryBadge = metaBadges.find((item) => item.key === 'category');
  const criticalityBadge = metaBadges.find((item) => item.key === 'criticality');
  const accessBadge = metaBadges.find((item) => item.key === 'access');
  const folderBadge = metaBadges.find((item) => item.key === 'folder');
  const healthBadge = credentialHealthBadge(cred.health);
  const preview = buildCredentialVaultPreview(cred);
  const primaryFolder = resolvePrimaryCredentialFolder(cred);

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
          {onSetFavorite ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              data-credential-vault-action
              aria-label={cred.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={cn(
                'size-7 shrink-0 transition-opacity',
                cred.isFavorite
                  ? 'text-amber-500 opacity-100 hover:text-amber-600'
                  : 'text-muted-foreground opacity-0 group-hover:opacity-100',
              )}
              onClick={(event) => {
                event.stopPropagation();
                onSetFavorite(cred.id, !cred.isFavorite);
              }}
            >
              <Star className={cn('size-4', cred.isFavorite ? 'fill-current' : null)} />
            </Button>
          ) : null}
          <KeyRound size={14} className="text-muted-foreground" />
          <span className="font-medium">{cred.name}</span>
        </div>
        {primaryFolder && folderBadge ? (
          <div className={cn('mt-1', onSetFavorite ? 'pl-16' : 'pl-6')}>
            <CredentialVaultMetaBadge item={folderBadge} />
          </div>
        ) : null}
      </TableCell>
      <TableCell className="max-w-[180px]" onClick={(e) => e.stopPropagation()}>
        {renderPreviewCell(0)}
      </TableCell>
      <TableCell className="max-w-[140px]" onClick={(e) => e.stopPropagation()}>
        {renderPreviewCell(1)}
      </TableCell>
      <TableCell>
        {categoryBadge ? (
          <CredentialVaultMetaBadge item={categoryBadge} className="text-xs" />
        ) : (
          <span className="text-xs">{category.label}</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatCredentialTypeLabel(cred.credentialType)}
      </TableCell>
      <TableCell>
        {criticalityBadge ? <CredentialVaultMetaBadge item={criticalityBadge} /> : null}
      </TableCell>
      <TableCell>
        {access && accessBadge ? <CredentialVaultMetaBadge item={accessBadge} /> : null}
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
