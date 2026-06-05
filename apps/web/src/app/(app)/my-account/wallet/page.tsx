import { redirect } from 'next/navigation';
import { MY_WALLET_OPEN_QUERY } from '@/features/account/constants/my-account-sheet';

/** Legacy bookmark — opens global wallet sheet on dashboard. */
export default function MyAccountWalletLegacyRedirectPage() {
  redirect(`/dashboard?${MY_WALLET_OPEN_QUERY}=1`);
}
