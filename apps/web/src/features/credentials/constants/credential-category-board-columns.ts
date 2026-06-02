import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { KanbanColumn } from '@/components/shared/kanban/kanban.types';
import { credentialCategoryAccentBarClass } from '@/features/credentials/constants/credential-category-meta';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export const CREDENTIAL_VAULT_KANBAN_COLUMN_WIDTH = 280;

export function buildCredentialCategoryKanbanColumns(
  credentials: CredentialListItem[],
  categoryColumns: readonly CredentialCategoryOption[],
): KanbanColumn<CredentialListItem>[] {
  const buckets = new Map<string, CredentialListItem[]>();
  for (const col of categoryColumns) {
    buckets.set(col.value, []);
  }

  for (const credential of credentials) {
    const key = buckets.has(credential.category) ? credential.category : 'OTHER';
    buckets.get(key)?.push(credential);
  }

  return categoryColumns.map((col) => {
    const color = credentialCategoryAccentBarClass(col.value);
    return {
      key: col.value,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: buckets.get(col.value) ?? [],
      readonly: true as const,
    };
  });
}
