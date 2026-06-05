'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as WalletSheetTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-border shrink-0 border-b px-5 pb-0">
          <TabsList className="w-full justify-start">
            {WALLET_SHEET_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 text-xs sm:flex-none sm:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="overview" className="mt-0">
            <WalletOverviewTab
              data={data}
              onOpenMonth={onOpenMonth}
              onGoToBonuses={() => setActiveTab('bonuses')}
              onGoToPayroll={() => setActiveTab('payroll')}
            />
          </TabsContent>
          <TabsContent value="bonuses" className="mt-0">
            <WalletBonusesTab data={data} />
          </TabsContent>
          <TabsContent value="payroll" className="mt-0">
            <WalletPayrollTab
              data={data}
              openSalaryLineId={openSalaryLineId}
              onOpenMonth={onOpenMonth}
            />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <WalletActivityTab data={data} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
