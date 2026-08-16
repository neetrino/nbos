'use client';

import Link from 'next/link';
import { FolderKanban, KeyRound, Star } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
} from '@/components/shared/entity-list-table';
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
import { credentialProductHref } from '@/features/credentials/utils/credential-vault-card-meta';
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
  return <EntityListMutedDash />;
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
  const productHref = credentialProductHref(cred.project?.id, cred.product);
  const projectHref = cred.project?.id ? `/projects/${cred.project.id}` : null;

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
        <EntityListMutedDash />
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
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
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
          <KeyRound size={14} className="text-muted-foreground shrink-0" aria-hidden />
          <EntityListPrimaryCell title={cred.name} />
        </div>
        {primaryFolder && folderBadge ? (
          <div className={cn('mt-1', onSetFavorite ? 'pl-16' : 'pl-6')}>
            <CredentialVaultMetaBadge item={folderBadge} className={ENTITY_LIST_BADGE_CLASS} />
          </div>
        ) : null}
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} max-w-[180px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {renderPreviewCell(0)}
      </TableCell>
      <TableCell
        className={`${ENTITY_LIST_CELL_CLASS} max-w-[140px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {renderPreviewCell(1)}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {categoryBadge ? (
          <CredentialVaultMetaBadge item={categoryBadge} className={ENTITY_LIST_BADGE_CLASS} />
        ) : (
          <span className="text-xs">{category.label}</span>
        )}
      </TableCell>
      <TableCell className={`${ENTITY_LIST_CELL_CLASS} text-muted-foreground text-xs`}>
        {formatCredentialTypeLabel(cred.credentialType)}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {criticalityBadge ? (
          <CredentialVaultMetaBadge item={criticalityBadge} className={ENTITY_LIST_BADGE_CLASS} />
        ) : null}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {access && accessBadge ? (
          <CredentialVaultMetaBadge item={accessBadge} className={ENTITY_LIST_BADGE_CLASS} />
        ) : null}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS} onClick={(e) => e.stopPropagation()}>
        {cred.product && productHref ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={productHref}
              className="text-foreground hover:text-primary truncate text-xs font-medium"
            >
              {cred.product.name}
            </Link>
            {cred.project && projectHref ? (
              <Link
                href={projectHref}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 truncate text-[11px]"
              >
                <FolderKanban size={10} aria-hidden />
                {cred.project.name}
              </Link>
            ) : null}
          </div>
        ) : cred.project && projectHref ? (
          <Link
            href={projectHref}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            <FolderKanban size={10} aria-hidden />
            {cred.project.name}
          </Link>
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <div className="flex flex-col gap-1">
          <EntityListDate value={cred.nextRotationAt} emptyLabel="No date" />
          {healthBadge ? (
            <StatusBadge
              label={healthBadge.label}
              variant={healthBadge.variant}
              className={ENTITY_LIST_BADGE_CLASS}
            />
          ) : null}
        </div>
      </TableCell>
    </>
  );
}
