import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { KanbanColumn } from '@/components/shared/kanban/kanban.types';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

/** Kanban header colors per credential category (platform `KanbanBoard` stage bars). */
const CREDENTIAL_CATEGORY_COLUMN_COLORS: Record<string, string> = {
  ADMIN: 'bg-slate-600',
  DOMAIN: 'bg-blue-500',
  HOSTING: 'bg-cyan-600',
  SERVICE: 'bg-violet-500',
  APP: 'bg-indigo-500',
  MAIL: 'bg-sky-500',
  API_KEY: 'bg-amber-500',
  DATABASE: 'bg-emerald-600',
  OTHER: 'bg-gray-400',
};

const DEFAULT_COLUMN_COLOR = 'bg-gray-400';

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
    const color = CREDENTIAL_CATEGORY_COLUMN_COLORS[col.value] ?? DEFAULT_COLUMN_COLOR;
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
