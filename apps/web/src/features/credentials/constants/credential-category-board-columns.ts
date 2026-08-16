import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { KanbanColumn } from '@/components/shared/kanban/kanban.types';
import { credentialCategoryAccentBarClass } from '@/features/credentials/constants/credential-category-meta';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import { resolveCredentialCategoryBucket } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialCategoryColumnMeta } from '@/features/credentials/hooks/use-credentials-category-column-board';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export const CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH = 280;

export function buildCredentialCategoryKanbanColumns(
  credentials: CredentialListItem[],
  categoryColumns: readonly CredentialCategoryOption[],
  columnMeta?: Record<string, CredentialCategoryColumnMeta>,
): KanbanColumn<CredentialListItem>[] {
  const buckets = new Map<string, CredentialListItem[]>();
  for (const col of categoryColumns) {
    buckets.set(col.value, []);
  }

  for (const credential of credentials) {
    const key = resolveCredentialCategoryBucket(credential.category, categoryColumns);
    buckets.get(key)?.push(credential);
  }

  return categoryColumns.map((col) => {
    const color = credentialCategoryAccentBarClass(col.value);
    const meta = columnMeta?.[col.value];
    return {
      key: col.value,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: buckets.get(col.value) ?? [],
      readonly: true as const,
      totalCount: meta?.totalCount,
      hasMore: meta?.hasMore,
      loadingMore: meta?.loadingMore,
    };
  });
}
