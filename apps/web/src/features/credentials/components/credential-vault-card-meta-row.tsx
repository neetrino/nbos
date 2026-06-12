'use client';

import { Fragment } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  CREDENTIAL_VAULT_CARD_BADGE_CLASS,
  type CredentialVaultMetaBadge,
} from '@/features/credentials/utils/credential-vault-card-meta';

export function CredentialVaultMetaBadge({
  item,
  className = CREDENTIAL_VAULT_CARD_BADGE_CLASS,
}: {
  item: CredentialVaultMetaBadge;
  className?: string;
}) {
  const Icon = item.icon;
  return (
    <StatusBadge
      label={item.label}
      variant={item.variant}
      className={className}
      icon={<Icon className="size-2.5 shrink-0 opacity-90" aria-hidden />}
    />
  );
}

export function CredentialVaultCardMetaRow({ items }: { items: CredentialVaultMetaBadge[] }) {
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
          <CredentialVaultMetaBadge item={item} />
        </Fragment>
      ))}
    </div>
  );
}
