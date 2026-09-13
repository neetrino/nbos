import { Columns3, Folder, LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';

export type CredentialVaultViewMode = 'list' | 'tiles' | 'category-board' | 'folders';

export const CREDENTIAL_VAULT_VIEW_OPTIONS: ViewModeOption<CredentialVaultViewMode>[] = [
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
  {
    value: 'tiles',
    label: 'Tiles',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Tiles view',
  },
  {
    value: 'category-board',
    label: 'Categories',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Category board view',
  },
  {
    value: 'folders',
    label: 'Folders',
    icon: <Folder className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Folders view',
  },
];

export type CredentialQuickFilterKey = 'mine' | 'needsRotation' | 'favorites';

const VIEW_MESSAGE_KEYS = {
  list: { label: 'views.list', aria: 'views.listAria' },
  tiles: { label: 'views.tiles', aria: 'views.tilesAria' },
  'category-board': { label: 'views.categoryBoard', aria: 'views.categoryBoardAria' },
  folders: { label: 'views.folders', aria: 'views.foldersAria' },
} as const;

export function localizeCredentialVaultViewOptions(
  t: (key: string) => string,
): ViewModeOption<CredentialVaultViewMode>[] {
  return CREDENTIAL_VAULT_VIEW_OPTIONS.map((option) => {
    const keys = VIEW_MESSAGE_KEYS[option.value];
    return { ...option, label: t(keys.label), ariaLabel: t(keys.aria) };
  });
}
