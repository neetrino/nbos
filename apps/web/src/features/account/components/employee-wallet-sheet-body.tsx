'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DetailSheetTabBar } from '@/components/shared';
import { WalletActivityTab } from '@/features/account/components/wallet-activity-tab';
import { WalletBonusesTab } from '@/features/account/components/wallet-bonuses-tab';
import { WalletOverviewTab } from '@/features/account/components/wallet-overview-tab';
import { WalletPayrollTab } from '@/features/account/components/wallet-payroll-tab';
import { WalletSheetHeader } from '@/features/account/components/wallet-sheet-header';
import { WALLET_SHEET_TABS, type WalletSheetTab } from '@/features/account/constants/wallet-ui';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

interface EmployeeWalletSheetBodyProps {
  data: EmployeeWalletSnapshot;
  openSalaryLineId: string | null;
  onOpenMonth: (salaryLineId: string) => void;
  bonusSubmitting: boolean;
  salarySubmitting: boolean;
  projectBreakdownSubmitting: boolean;
  onExportBonusesCsv: () => void;
  onExportSalaryCsv: () => void;
  onExportProjectBreakdownCsv: () => void;
}

export function EmployeeWalletSheetBody({
  data,
  openSalaryLineId,
  onOpenMonth,
  bonusSubmitting,
  salarySubmitting,
  projectBreakdownSubmitting,
  onExportBonusesCsv,
  onExportSalaryCsv,
  onExportProjectBreakdownCsv,
}: EmployeeWalletSheetBodyProps) {
  const [activeTab, setActiveTab] = useState<WalletSheetTab>('overview');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WalletSheetHeader
        bonusSubmitting={bonusSubmitting}
        salarySubmitting={salarySubmitting}
        projectBreakdownSubmitting={projectBreakdownSubmitting}
        canExportBonuses={data.bonuses.length > 0}
        canExportSalary={data.salaryHistory.length > 0}
        canExportProjects={data.projectBreakdown.length > 0}
        onExportBonusesCsv={onExportBonusesCsv}
        onExportSalaryCsv={onExportSalaryCsv}
        onExportProjectBreakdownCsv={onExportProjectBreakdownCsv}
      />

      <DetailSheetTabBar
        tabs={WALLET_SHEET_TABS}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as WalletSheetTab)}
      />

      <ScrollArea className="min-h-0 flex-1">
        {activeTab === 'overview' ? (
          <WalletOverviewTab
            data={data}
            onOpenMonth={onOpenMonth}
            onGoToBonuses={() => setActiveTab('bonuses')}
            onGoToPayroll={() => setActiveTab('payroll')}
          />
        ) : null}
        {activeTab === 'bonuses' ? <WalletBonusesTab data={data} /> : null}
        {activeTab === 'payroll' ? (
          <WalletPayrollTab
            data={data}
            openSalaryLineId={openSalaryLineId}
            onOpenMonth={onOpenMonth}
          />
        ) : null}
        {activeTab === 'activity' ? <WalletActivityTab data={data} /> : null}
      </ScrollArea>
    </div>
  );
}
