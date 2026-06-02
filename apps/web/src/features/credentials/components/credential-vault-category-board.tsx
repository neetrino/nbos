'use client';

import { useMemo } from 'react';
import { KanbanBoard } from '@/components/shared';
import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import {
  buildCredentialCategoryKanbanColumns,
  CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH,
} from '@/features/credentials/constants/credential-category-board-columns';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { CredentialVaultCategoryCard } from './CredentialVaultCategoryCard';

const COLUMN_SKELETON_COUNT = 4;
const CARD_SKELETON_COUNT = 3;

export interface CredentialVaultCategoryBoardProps {
  credentials: CredentialListItem[];
  loading: boolean;
  vaultScope: CredentialVaultScope;
  showCreate: boolean;
  categoryColumns?: readonly CredentialCategoryOption[];
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
}

export function CredentialVaultCategoryBoard({
  credentials,
  loading,
  vaultScope,
  showCreate,
  categoryColumns,
  onCreateInCategory,
  onOpenCredential,
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
              <Skeleton key={cardIndex} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        columnWidth={CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH}
        emptyMessage="No credentials"
        getItemId={(item) => item.id}
        columnQuickCreate={quickCreate}
        renderCard={(credential) => (
          <CredentialVaultCategoryCard credential={credential} onOpen={onOpenCredential} />
        )}
      />
    </div>
  );
}
