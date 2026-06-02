'use client';

import { Fragment } from 'react';
import { StatusBadge, type StatusVariant } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import { CredentialVaultSecretPills } from '@/features/credentials/components/credential-vault-secret-pills';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import {
  formatCredentialAccessLabel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

type CredentialVaultCardVariant = 'grid' | 'kanban';

const VAULT_CARD_BADGE_CLASS = 'h-4 shrink-0 px-1.5 py-0 text-[10px] leading-none';

const VAULT_CARD_SHELL_CLASS = cn(
  'border-border bg-card group/card relative flex w-full cursor-pointer flex-col overflow-hidden border',
  'shadow-none transition-shadow duration-200 ease-out hover:shadow-md',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

const VAULT_CARD_BODY_CLASS = 'flex flex-col gap-1.5 p-2.5 pl-3';

const VAULT_CARD_TITLE_CLASS = 'text-foreground line-clamp-2 text-sm leading-snug font-medium';

function shellClassForVariant(variant: CredentialVaultCardVariant): string {
  return cn(VAULT_CARD_SHELL_CLASS, variant === 'grid' ? 'rounded-lg' : 'rounded-xl');
}

interface VaultCardMetaItem {
  key: string;
  label: string;
  variant: StatusVariant;
}

function CredentialVaultCardMetaRow({ items }: { items: VaultCardMetaItem[] }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
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

  const showCopyStrip = Boolean(onCopyLogin);
  const showPassword =
    showCopyStrip && Boolean(onCopyPassword) && Boolean(credential.secretsPresent?.password);

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
      <span
        className={cn('absolute top-0 bottom-0 left-0 w-0.5', category.accentBarClass)}
        aria-hidden
      />
      <div className={VAULT_CARD_BODY_CLASS}>
        <p className={VAULT_CARD_TITLE_CLASS}>{credential.name}</p>
        {showCopyStrip && onCopyLogin ? (
          <CredentialVaultSecretPills
            login={credential.login}
            showPassword={showPassword}
            passwordCopied={passwordFlashCredentialId === credential.id}
            onCopyLogin={onCopyLogin}
            onCopyPassword={() => onCopyPassword!(credential.id)}
          />
        ) : null}
        <CredentialVaultCardMetaRow items={metaItems} />
      </div>
    </div>
  );
}
