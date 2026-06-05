import { WalletRecentActivitySection } from '@/features/account/components/wallet-recent-activity-section';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

interface WalletActivityTabProps {
  data: EmployeeWalletSnapshot;
}

export function WalletActivityTab({ data }: WalletActivityTabProps) {
  return (
    <div className="px-5 py-4">
      <WalletRecentActivitySection activity={data.activity} />
    </div>
  );
}
