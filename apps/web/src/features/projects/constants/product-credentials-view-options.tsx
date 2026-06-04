import { LayoutGrid, List } from 'lucide-react';
import type { ViewModeOption } from '@/components/shared';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';

/** Product Credentials tab: Vault list + tiles (canon option A). */
export type ProductCredentialsViewMode = Extract<CredentialVaultViewMode, 'list' | 'tiles'>;

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
];
