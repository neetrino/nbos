'use client';

import { Fragment } from 'react';
import { KanbanCardShell } from '@/components/shared';
import { StatusBadge, type StatusVariant } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { CredentialVaultPreviewStrip } from '@/features/credentials/components/credential-vault-preview-strip';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import {
  formatCredentialAccessLabel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { CredentialVaultSelectCheckbox } from '@/features/credentials/components/credential-vault-select-checkbox';
import {
  credentialVaultCheckboxRevealClass,
  isCredentialVaultCheckboxTarget,
} from '@/features/credentials/constants/credential-vault-selection-checkbox';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';

type CredentialVaultCardVariant = 'grid' | 'kanban';

const VAULT_CARD_BADGE_CLASS = 'h-4 shrink-0 px-1.5 py-0 text-[10px] leading-none';

const VAULT_CARD_BODY_CLASS = 'flex h-full min-h-0 flex-1 flex-col gap-1.5 p-2.5 pl-3';

const VAULT_CARD_TITLE_CLASS = 'text-foreground line-clamp-2 text-sm leading-snug font-medium';

interface VaultCardMetaItem {
  key: string;
  label: string;
  variant: StatusVariant;
}

function CredentialVaultCardMetaRow({ items }: { items: VaultCardMetaItem[] }) {
  return (
    <div className="mt-auto flex min-w-0 shrink-0 flex-wrap items-center gap-1 pt-0.5">
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? (
            <span
              className="text-muted-foreground/45 shrink-0 text-[10px] leading-none select-none"
              aria-hidden
            >
              |
            </span>
          ) : null}
          <StatusBadge
            label={item.label}
            variant={item.variant}
            className={VAULT_CARD_BADGE_CLASS}
          />
        </Fragment>
      ))}
    </div>
  );
}

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
}: CredentialVaultCardProps) {
  const category = getCredentialCategoryMeta(credential.category);
  const criticality = getCredentialCriticality(credential.criticality);
  const accessLabel = formatCredentialAccessLabel(credential.accessLevel);

  const metaItems: VaultCardMetaItem[] = [
    { key: 'category', label: category.label, variant: category.badgeVariant },
  ];
  if (criticality) {
    metaItems.push({
      key: 'criticality',
      label: criticality.label,
      variant: criticality.variant,
    });
  }
  metaItems.push({ key: 'access', label: accessLabel, variant: 'gray' });

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
  );
}
