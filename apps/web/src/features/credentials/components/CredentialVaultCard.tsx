'use client';

import { Star } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CredentialVaultPreviewStrip } from '@/features/credentials/components/credential-vault-preview-strip';
import { CredentialVaultCardMetaRow } from '@/features/credentials/components/credential-vault-card-meta-row';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import {
  credentialVaultCheckboxRevealClass,
  isCredentialVaultCheckboxTarget,
} from '@/features/credentials/constants/credential-vault-selection-checkbox';
import { buildCredentialVaultCardMetaBadges } from '@/features/credentials/utils/credential-vault-card-meta';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';

type CredentialVaultCardVariant = 'grid' | 'kanban';

const VAULT_CARD_BODY_CLASS = 'flex h-full min-h-0 flex-1 flex-col gap-1.5 p-2.5 pl-3';

const VAULT_CARD_TITLE_CLASS = 'text-foreground line-clamp-2 text-sm leading-snug font-medium';

export interface CredentialVaultCardProps {
  credential: CredentialListItem;
  variant: CredentialVaultCardVariant;
  onOpen: (id: string) => void;
  onCopyText?: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
  selectionEnabled?: boolean;
  selectionActive?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
}

export function CredentialVaultCard({
  credential,
  variant,
  onOpen,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
  selectionEnabled = false,
  selectionActive = false,
  selected = false,
  onToggleSelected,
  onSetFavorite,
}: CredentialVaultCardProps) {
  const category = getCredentialCategoryMeta(credential.category);
  const metaItems = buildCredentialVaultCardMetaBadges(credential);

  return (
    <KanbanCardShell
      role="button"
      tabIndex={0}
      radius={variant === 'grid' ? 'lg' : 'xl'}
      padding="none"
      hoverShadow="md"
      className={cn(
        'group/card relative flex h-full min-h-[104px] w-full cursor-pointer flex-col overflow-hidden',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
      onClick={(event) => {
        if (isCredentialVaultCheckboxTarget(event.target)) return;
        onOpen(credential.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(credential.id);
        }
      }}
    >
      <span
        className={cn('absolute top-0 bottom-0 left-0 w-0.5', category.accentBarClass)}
        aria-hidden
      />
      {selectionEnabled && onToggleSelected ? (
        <div
          className={cn(
            'absolute top-2 right-2 z-10',
            credentialVaultCheckboxRevealClass(
              selectionActive,
              selected,
              'group-hover/card:opacity-100',
            ),
          )}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <CredentialVaultSelectCheckbox
            checked={selected}
            ariaLabel={`Select ${credential.name}`}
            onToggle={onToggleSelected}
          />
        </div>
      ) : null}
      {onSetFavorite ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          data-credential-vault-action
          aria-label={credential.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'absolute top-1.5 z-10 size-7',
            selectionEnabled ? 'right-9' : 'right-1.5',
            credential.isFavorite
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={(event) => {
            event.stopPropagation();
            onSetFavorite(credential.id, !credential.isFavorite);
          }}
        >
          <Star
            className={cn('size-4', credential.isFavorite ? 'fill-current' : null)}
            aria-hidden
          />
        </Button>
      ) : null}
      <div className={VAULT_CARD_BODY_CLASS}>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <p className={cn(VAULT_CARD_TITLE_CLASS, onSetFavorite ? 'pr-8' : null)}>
            {credential.name}
          </p>
          <CredentialVaultPreviewStrip
            className="min-h-0 flex-1"
            credential={credential}
            secretFlashCredentialId={secretFlashCredentialId}
            onCopyText={onCopyText}
            onCopySecret={onCopySecret}
          />
        </div>
        <CredentialVaultCardMetaRow items={metaItems} />
      </div>
    </KanbanCardShell>
  );
}
