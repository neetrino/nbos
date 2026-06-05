import { redirect } from 'next/navigation';
import { MY_ACCOUNT_OPEN_QUERY } from '@/features/account/constants/my-account-sheet';

/** Legacy bookmark — opens global profile sheet on dashboard. */
export default function MyAccountLegacyRedirectPage() {
  redirect(`/dashboard?${MY_ACCOUNT_OPEN_QUERY}=1`);
}
