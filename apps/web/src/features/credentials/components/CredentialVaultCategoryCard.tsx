'use client';

import { KeyRound } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  formatCredentialAccessLabel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export interface CredentialVaultCategoryCardProps {
  credential: CredentialListItem;
  onOpen: (id: string) => void;
}

/** Kanban card — same surface pattern as Support / Expense plan boards. */
export function CredentialVaultCategoryCard({
  credential,
  onOpen,
}: CredentialVaultCategoryCardProps) {
  const criticality = getCredentialCriticality(credential.criticality);
  const accessLabel = formatCredentialAccessLabel(credential.accessLevel);

  return (
    <div
      role="button"
      tabIndex={0}
      className="border-border bg-card hover:bg-muted/30 cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
      onClick={() => onOpen(credential.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(credential.id);
        }
      }}
    >
      <div className="flex items-start gap-2">
        <KeyRound size={12} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <p className="text-foreground line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-medium">
          {credential.name}
        </p>
      </div>
      <p className="text-muted-foreground truncate text-xs">
        {credential.provider ?? credential.login ?? '—'}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {criticality ? (
          <StatusBadge label={criticality.label} variant={criticality.variant} />
        ) : null}
        <StatusBadge label={accessLabel} variant="gray" />
      </div>
    </div>
  );
}
