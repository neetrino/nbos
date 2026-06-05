'use client';

import { useMemo } from 'react';
import { KanbanBoard } from '@/components/shared';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import { categoriesForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import {
  buildCredentialCategoryKanbanColumns,
  CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH,
} from '@/features/credentials/constants/credential-category-board-columns';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';

const COLUMN_SKELETON_COUNT = 4;
const CARD_SKELETON_COUNT = 3;
const KANBAN_CARD_SKELETON_HEIGHT_CLASS = 'h-[100px]';

export interface CredentialVaultCategoryBoardProps {
  credentials: CredentialListItem[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  scrollRoot?: HTMLElement | null;
  onLoadMore?: () => void;
  vaultScope: CredentialVaultScope;
  showCreate: boolean;
  categoryColumns?: readonly CredentialCategoryOption[];
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
  onCopyText?: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
}

export function CredentialVaultCategoryBoard({
  credentials,
  loading,
  loadingMore = false,
  hasMore = false,
  scrollRoot,
  onLoadMore,
  vaultScope,
  showCreate,
  categoryColumns,
  onCreateInCategory,
  onOpenCredential,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
}: CredentialVaultCategoryBoardProps) {
  const columns = useMemo(() => {
    const defs = categoryColumns ?? categoriesForVaultScope(vaultScope);
    return buildCredentialCategoryKanbanColumns(credentials, defs);
  }, [credentials, categoryColumns, vaultScope]);

  const quickCreate = useMemo((): KanbanColumnQuickCreateConfig<CredentialListItem> | undefined => {
    if (!showCreate) return undefined;
    return {
      isEnabled: () => true,
      buttonLabel: 'Credential',
      onOpenDialog: (columnKey) => onCreateInCategory(columnKey),
    };
  }, [showCreate, onCreateInCategory]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {Array.from({ length: COLUMN_SKELETON_COUNT }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="border-border w-[280px] shrink-0 space-y-2 rounded-xl border p-2"
          >
            <Skeleton className="h-8 w-full rounded-md" />
            {Array.from({ length: CARD_SKELETON_COUNT }).map((__, cardIndex) => (
              <Skeleton
                key={cardIndex}
                className={cn(KANBAN_CARD_SKELETON_HEIGHT_CLASS, 'w-full rounded-xl')}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      <div className="min-h-0 flex-1">
        <KanbanBoard
          columns={columns}
          columnWidth={CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH}
          emptyMessage="No credentials"
          getItemId={(item) => item.id}
          columnQuickCreate={quickCreate}
          renderCard={(credential) => (
            <CredentialVaultCard
              credential={credential}
              variant="kanban"
              onOpen={onOpenCredential}
              onCopyText={onCopyText}
              onCopySecret={onCopySecret}
              secretFlashCredentialId={secretFlashCredentialId}
            />
          )}
        />
      </div>
      {onLoadMore ? (
        <InfiniteScrollSentinel
          onReach={onLoadMore}
          disabled={!hasMore || loading || loadingMore}
          root={scrollRoot}
        />
      ) : null}
      {loadingMore ? (
        <p className="text-muted-foreground py-1 text-center text-xs">Loading more…</p>
      ) : null}
    </div>
  );
}
