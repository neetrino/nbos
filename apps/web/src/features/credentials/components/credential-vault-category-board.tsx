'use client';

import { useMemo } from 'react';
import { KanbanBoard } from '@/components/shared';
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
import type { CredentialCategoryColumnMeta } from '@/features/credentials/hooks/use-credentials-category-column-board';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';

const CARD_SKELETON_COUNT = 3;
const KANBAN_CARD_SKELETON_HEIGHT_CLASS = 'h-[100px]';

export interface CredentialVaultCategoryBoardProps {
  credentials: CredentialListItem[];
  loading: boolean;
  columnMeta?: Record<string, CredentialCategoryColumnMeta>;
  onColumnLoadMore?: (columnKey: string) => void;
  vaultScope: CredentialVaultScope;
  showCreate: boolean;
  categoryColumns?: readonly CredentialCategoryOption[];
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
  onRequestMoveToTrash?: (id: string, name: string) => void;
  canMoveToTrash?: boolean;
  onCopyText?: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
}

export function CredentialVaultCategoryBoard({
  credentials,
  loading,
  columnMeta,
  onColumnLoadMore,
  vaultScope,
  showCreate,
  categoryColumns,
  onCreateInCategory,
  onOpenCredential,
  onSetFavorite,
  onRequestMoveToTrash,
  canMoveToTrash = false,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
}: CredentialVaultCategoryBoardProps) {
  const columnDefs = categoryColumns ?? categoriesForVaultScope(vaultScope);
  const columns = useMemo(
    () => buildCredentialCategoryKanbanColumns(credentials, columnDefs, columnMeta),
    [credentials, columnDefs, columnMeta],
  );

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
        {columnDefs.map((column) => (
          <div
            key={column.value}
            className="border-border w-[280px] shrink-0 space-y-2 rounded-xl border p-2"
          >
            <Skeleton className="h-8 w-full rounded-md" />
            {Array.from({ length: CARD_SKELETON_COUNT }).map((_, cardIndex) => (
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
    <KanbanBoard
      columns={columns}
      columnWidth={CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH}
      emptyMessage="No credentials"
      getItemId={(item) => item.id}
      columnQuickCreate={quickCreate}
      onColumnLoadMore={onColumnLoadMore}
      renderCard={(credential) => (
        <CredentialVaultCard
          credential={credential}
          variant="kanban"
          onOpen={onOpenCredential}
          onSetFavorite={onSetFavorite}
          onRequestMoveToTrash={onRequestMoveToTrash}
          canMoveToTrash={canMoveToTrash}
          onCopyText={onCopyText}
          onCopySecret={onCopySecret}
          secretFlashCredentialId={secretFlashCredentialId}
        />
      )}
    />
  );
}
