import { Columns3, LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';

export type CredentialVaultViewMode = 'list' | 'tiles' | 'category-board';

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
];

export type CredentialQuickFilterKey = 'mine' | 'needsRotation';
