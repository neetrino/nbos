'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartnerAccrualsCard } from '@/features/partners/components/PartnerAccrualsCard';
import { PartnerAgreementsCard } from '@/features/partners/components/PartnerAgreementsCard';
import { PartnerAnalyticsCard } from '@/features/partners/components/PartnerAnalyticsCard';
import { PartnerCommissionPolicyCard } from '@/features/partners/components/PartnerCommissionPolicyCard';
import { PartnerOutboundServicesCard } from '@/features/partners/components/PartnerOutboundServicesCard';
import { PartnerOverviewTab } from '@/features/partners/components/PartnerOverviewTab';
import type { Partner } from '@/lib/api/partners';

const TAB_OVERVIEW = 'overview';
const TAB_COMMISSION = 'commission';
const TAB_PAYOUTS = 'payouts';
const TAB_OUTBOUND = 'outbound';
const TAB_AGREEMENTS = 'agreements';
const TAB_ANALYTICS = 'analytics';

export function PartnerDetailTabs(props: {
  partner: Partner;
  onPartnerUpdated: (p: Partner) => void;
  accrualsReloadKey: number;
}) {
  const { partner, onPartnerUpdated, accrualsReloadKey } = props;

  return (
    <Tabs defaultValue={TAB_OVERVIEW} className="w-full">
      <TabsList variant="line" className="mb-4 w-full flex-wrap justify-start gap-1">
        <TabsTrigger value={TAB_OVERVIEW}>Overview</TabsTrigger>
        <TabsTrigger value={TAB_COMMISSION}>Commission</TabsTrigger>
        <TabsTrigger value={TAB_PAYOUTS}>Payouts</TabsTrigger>
        <TabsTrigger value={TAB_OUTBOUND}>Outbound</TabsTrigger>
        <TabsTrigger value={TAB_AGREEMENTS}>Agreement</TabsTrigger>
        <TabsTrigger value={TAB_ANALYTICS}>Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value={TAB_OVERVIEW} className="mt-0">
        <PartnerOverviewTab partner={partner} />
      </TabsContent>

      <TabsContent value={TAB_COMMISSION} className="mt-0">
        <PartnerCommissionPolicyCard partnerId={partner.id} />
      </TabsContent>

      <TabsContent value={TAB_PAYOUTS} className="mt-0">
        <PartnerAccrualsCard partnerId={partner.id} reloadKey={accrualsReloadKey} />
      </TabsContent>

      <TabsContent value={TAB_OUTBOUND} className="mt-0">
        <PartnerOutboundServicesCard partnerId={partner.id} reloadKey={accrualsReloadKey} />
      </TabsContent>

      <TabsContent value={TAB_AGREEMENTS} className="mt-0">
        <PartnerAgreementsCard partner={partner} onSaved={onPartnerUpdated} />
      </TabsContent>

      <TabsContent value={TAB_ANALYTICS} className="mt-0">
        <PartnerAnalyticsCard partnerId={partner.id} />
      </TabsContent>
    </Tabs>
  );
}
