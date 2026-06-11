'use client';

import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import { CredentialVaultPreviewStrip } from '@/features/credentials/components/credential-vault-preview-strip';
import { CredentialVaultCardMetaRow } from '@/features/credentials/components/credential-vault-card-meta-row';
import { CredentialVaultCardHoverActions } from '@/features/credentials/components/credential-vault-card-hover-actions';
import { getCredentialCriticality } from '@/features/credentials/constants/credentials';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import {
  credentialVaultCheckboxRevealClass,
  isCredentialVaultCheckboxTarget,
} from '@/features/credentials/constants/credential-vault-selection-checkbox';
import {
  buildCredentialVaultCardMetaBadges,
  credentialCriticalityAccentBarClass,
} from '@/features/credentials/utils/credential-vault-card-meta';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';

type CredentialVaultCardVariant = 'grid' | 'kanban';

const VAULT_CARD_WRAPPER_CLASS =
  'group/card relative z-0 hover:z-30 focus-within:z-30 has-[[data-credential-vault-action]:hover]:z-30';
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
  onRequestArchive?: (id: string, name: string) => void;
  canArchive?: boolean;
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
  onRequestArchive,
  canArchive = false,
}: CredentialVaultCardProps) {
  const criticalityMeta = getCredentialCriticality(credential.criticality);
  const metaItems = buildCredentialVaultCardMetaBadges(credential, {
    includeCriticality: false,
  });

  return (
    <div className={VAULT_CARD_WRAPPER_CLASS}>
      <CredentialVaultCardHoverActions
        credentialId={credential.id}
        url={credential.url}
        isFavorite={Boolean(credential.isFavorite)}
        canArchive={canArchive}
        onSetFavorite={
          onSetFavorite ? (favorite) => onSetFavorite(credential.id, favorite) : undefined
        }
        onRequestArchive={
          onRequestArchive ? () => onRequestArchive(credential.id, credential.name) : undefined
        }
      />
      <KanbanCardShell
        role="button"
        tabIndex={0}
        radius={variant === 'grid' ? 'lg' : 'xl'}
        padding="none"
        hoverShadow="md"
        className={cn(
          'relative flex h-full min-h-[104px] w-full cursor-pointer flex-col overflow-hidden',
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
          className={cn(
            'absolute top-0 bottom-0 left-0 w-0.5',
            credentialCriticalityAccentBarClass(credential.criticality),
          )}
          title={criticalityMeta?.label}
          aria-label={criticalityMeta ? `Criticality: ${criticalityMeta.label}` : 'Criticality'}
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
        <div className={VAULT_CARD_BODY_CLASS}>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <p className={VAULT_CARD_TITLE_CLASS}>{credential.name}</p>
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
    </div>
  );
}
