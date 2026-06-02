'use client';

import { KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

type CredentialCategoryValue = (typeof CREDENTIAL_CATEGORIES)[number]['value'];

const COLUMN_SKELETON_COUNT = 4;
const CARD_SKELETON_COUNT = 3;

export interface CredentialVaultCategoryBoardProps {
  credentials: CredentialListItem[];
  loading: boolean;
  showCreate: boolean;
  /** Column set for current vault scope; defaults to all categories. */
  categoryColumns?: readonly CredentialCategoryOption[];
  onCreateInCategory: (category: CredentialCategoryValue) => void;
  onOpenCredential: (id: string) => void;
}

function groupCredentialsByCategory(
  credentials: CredentialListItem[],
  columns: readonly CredentialCategoryOption[],
): Map<CredentialCategoryValue, CredentialListItem[]> {
  const grouped = new Map<CredentialCategoryValue, CredentialListItem[]>();
  for (const category of columns) {
    grouped.set(category.value as CredentialCategoryValue, []);
  }
  for (const credential of credentials) {
    const category = credential.category as CredentialCategoryValue;
    const bucket = grouped.get(category);
    if (bucket) {
      bucket.push(credential);
      continue;
    }
    const otherBucket = grouped.get('OTHER');
    otherBucket?.push(credential);
  }
  return grouped;
}

function CategoryBoardCard({
  credential,
  onOpenCredential,
}: {
  credential: CredentialListItem;
  onOpenCredential: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="border-border bg-card hover:bg-muted/30 w-full rounded-lg border px-3 py-2.5 text-left transition-colors"
      onClick={() => onOpenCredential(credential.id)}
    >
      <div className="flex items-start gap-2">
        <KeyRound size={12} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-medium">{credential.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {credential.provider ?? credential.login ?? '—'}
          </p>
        </div>
      </div>
    </button>
  );
}

function CategoryColumn({
  label,
  category,
  items,
  showCreate,
  onCreateInCategory,
  onOpenCredential,
}: {
  label: string;
  category: CredentialCategoryValue;
  items: CredentialListItem[];
  showCreate: boolean;
  onCreateInCategory: (category: CredentialCategoryValue) => void;
  onOpenCredential: (id: string) => void;
}) {
  return (
    <section className="border-border bg-muted/20 flex w-64 shrink-0 flex-col rounded-xl border">
      <header className="border-border flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-sm font-semibold">{label}</h3>
          <p className="text-muted-foreground text-xs tabular-nums">{items.length}</p>
        </div>
        {showCreate ? (
          <PermissionGate module="CREDENTIALS" action="ADD">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={`Add ${label} credential`}
              aria-label={`Add ${label} credential`}
              onClick={() => onCreateInCategory(category)}
            >
              <Plus size={14} aria-hidden />
            </Button>
          </PermissionGate>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground px-1 py-4 text-center text-xs">No credentials</p>
        ) : (
          items.map((credential) => (
            <CategoryBoardCard
              key={credential.id}
              credential={credential}
              onOpenCredential={onOpenCredential}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function CredentialVaultCategoryBoard({
  credentials,
  loading,
  showCreate,
  categoryColumns = CREDENTIAL_CATEGORIES,
  onCreateInCategory,
  onOpenCredential,
}: CredentialVaultCategoryBoardProps) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: COLUMN_SKELETON_COUNT }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="border-border w-64 shrink-0 space-y-2 rounded-xl border p-3"
          >
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: CARD_SKELETON_COUNT }).map((__, cardIndex) => (
              <Skeleton key={cardIndex} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
      />
    );
  }

  const grouped = groupCredentialsByCategory(credentials, categoryColumns);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {categoryColumns.map((category) => (
        <CategoryColumn
          key={category.value}
          label={category.label}
          category={category.value as CredentialCategoryValue}
          items={grouped.get(category.value as CredentialCategoryValue) ?? []}
          showCreate={showCreate}
          onCreateInCategory={onCreateInCategory}
          onOpenCredential={onOpenCredential}
        />
      ))}
    </div>
  );
}
