'use client';

import { StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import { CredentialVaultSecretPills } from '@/features/credentials/components/credential-vault-secret-pills';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import {
  formatCredentialAccessLabel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export type CredentialVaultCardVariant = 'grid' | 'kanban';

const VAULT_CARD_BADGE_CLASS = 'h-4 shrink-0 px-1.5 py-0 text-[10px] leading-none';

const VAULT_CARD_SHELL_CLASS = cn(
  'border-border bg-card group/card relative flex w-full cursor-pointer flex-col overflow-hidden border',
  'shadow-none transition-shadow duration-200 ease-out hover:shadow-md',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

function shellClassForVariant(variant: CredentialVaultCardVariant): string {
  return cn(VAULT_CARD_SHELL_CLASS, variant === 'grid' ? 'rounded-lg' : 'rounded-xl');
}

function bodyClassForVariant(variant: CredentialVaultCardVariant): string {
  return cn('flex flex-col gap-1.5', variant === 'grid' ? 'p-2.5 pl-3' : 'p-3');
}

export interface CredentialVaultCardProps {
  credential: CredentialListItem;
  variant: CredentialVaultCardVariant;
  onOpen: (id: string) => void;
  onCopyLogin?: (login: string) => void;
  onCopyPassword?: (credentialId: string) => void;
  passwordFlashCredentialId?: string | null;
}

export function CredentialVaultCard({
  credential,
  variant,
  onOpen,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: CredentialVaultCardProps) {
  const category = getCredentialCategoryMeta(credential.category);
  const criticality = getCredentialCriticality(credential.criticality);
  const accessLabel = formatCredentialAccessLabel(credential.accessLevel);

  const showCategoryBadge = variant === 'grid';
  const showAccessBadge = variant === 'kanban';
  const showHighCriticality =
    variant === 'grid' &&
    criticality &&
    (credential.criticality === 'HIGH' || credential.criticality === 'CRITICAL');
  const showKanbanCriticality = variant === 'kanban' && Boolean(criticality);

  const showCopyStrip = Boolean(onCopyLogin);
  const showPassword =
    showCopyStrip && Boolean(onCopyPassword) && Boolean(credential.secretsPresent?.password);

  const titleClass =
    variant === 'grid'
      ? 'text-foreground line-clamp-2 min-h-[2lh] text-[11px] leading-snug font-medium'
      : 'text-foreground line-clamp-2 text-sm leading-snug font-medium';

  return (
    <div
      role="button"
      tabIndex={0}
      className={shellClassForVariant(variant)}
      onClick={() => onOpen(credential.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(credential.id);
        }
      }}
    >
      {showCategoryBadge ? (
        <span
          className={cn('absolute top-0 bottom-0 left-0 w-0.5', category.accentBarClass)}
          aria-hidden
        />
      ) : null}
      <div className={bodyClassForVariant(variant)}>
        {showCategoryBadge || showHighCriticality ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {showCategoryBadge ? (
              <StatusBadge
                label={category.label}
                variant={category.badgeVariant}
                className={VAULT_CARD_BADGE_CLASS}
              />
            ) : null}
            {showHighCriticality && criticality ? (
              <StatusBadge
                label={criticality.label}
                variant={criticality.variant}
                className={VAULT_CARD_BADGE_CLASS}
              />
            ) : null}
          </div>
        ) : null}
        <p className={titleClass}>{credential.name}</p>
        {showCopyStrip && onCopyLogin ? (
          <CredentialVaultSecretPills
            login={credential.login}
            showPassword={showPassword}
            passwordCopied={passwordFlashCredentialId === credential.id}
            onCopyLogin={onCopyLogin}
            onCopyPassword={() => onCopyPassword!(credential.id)}
          />
        ) : null}
        {showAccessBadge || showKanbanCriticality ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {showKanbanCriticality && criticality ? (
              <StatusBadge label={criticality.label} variant={criticality.variant} />
            ) : null}
            {showAccessBadge ? <StatusBadge label={accessLabel} variant="gray" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
