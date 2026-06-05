import { WalletBonusPipelineSection } from '@/features/account/components/wallet-bonus-pipeline-section';
import { WalletProjectBreakdownSection } from '@/features/account/components/wallet-project-breakdown-section';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

interface WalletBonusesTabProps {
  data: EmployeeWalletSnapshot;
}

export function WalletBonusesTab({ data }: WalletBonusesTabProps) {
  return (
    <div className="space-y-6 px-5 py-4">
      <WalletBonusPipelineSection bonuses={data.bonuses} />
      <WalletProjectBreakdownSection rows={data.projectBreakdown} />
    </div>
  );
}
