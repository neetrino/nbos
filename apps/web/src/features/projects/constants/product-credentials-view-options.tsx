import { Columns3, LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';

/** Product Credentials tab: Vault list, tiles, and category board. */
export type ProductCredentialsViewMode = Extract<
  CredentialVaultViewMode,
  'list' | 'tiles' | 'category-board'
>;

export const PRODUCT_CREDENTIALS_VIEW_OPTIONS: ViewModeOption<ProductCredentialsViewMode>[] = [
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
  {
    value: 'tiles',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card view',
  },
  {
    value: 'category-board',
    label: 'Categories',
    icon: <Columns3 className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Category board view',
  },
];
