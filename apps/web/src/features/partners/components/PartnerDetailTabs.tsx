'use client';

import { useState } from 'react';
import { BarChart3, FileText, Handshake, LayoutGrid, Percent, Wallet } from 'lucide-react';
import { DetailSheetTabBar } from '@/components/shared/DetailSheetTabBar';
import { PartnerAccrualsCard } from '@/features/partners/components/PartnerAccrualsCard';
import { PartnerAgreementsCard } from '@/features/partners/components/PartnerAgreementsCard';
import { PartnerAnalyticsCard } from '@/features/partners/components/PartnerAnalyticsCard';
import { PartnerCommissionPolicyCard } from '@/features/partners/components/PartnerCommissionPolicyCard';
import { PartnerOutboundServicesCard } from '@/features/partners/components/PartnerOutboundServicesCard';
import { PartnerOverviewTab } from '@/features/partners/components/PartnerOverviewTab';
import type { Partner } from '@/lib/api/partners';

export const PARTNER_DETAIL_TAB_IDS = [
  'overview',
  'commission',
  'payouts',
  'outbound',
  'agreements',
  'analytics',
] as const;

export type PartnerDetailTabId = (typeof PARTNER_DETAIL_TAB_IDS)[number];

const PARTNER_DETAIL_TAB_ITEMS = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid },
  { value: 'commission', label: 'Commission', icon: Percent },
  { value: 'payouts', label: 'Payouts', icon: Wallet },
  { value: 'outbound', label: 'Outbound', icon: Handshake },
  { value: 'agreements', label: 'Agreement', icon: FileText },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const satisfies ReadonlyArray<{
  value: PartnerDetailTabId;
  label: string;
  icon: typeof LayoutGrid;
}>;

export function PartnerDetailTabs(props: {
  partner: Partner;
  onPartnerUpdated: (p: Partner) => void;
  accrualsReloadKey: number;
}) {
  const { partner, onPartnerUpdated, accrualsReloadKey } = props;
  const [panel, setPanel] = useState<PartnerDetailTabId>('overview');

  return (
    <div className="w-full">
      <DetailSheetTabBar
        tabs={PARTNER_DETAIL_TAB_ITEMS}
        activeTab={panel}
        onTabChange={(value) => setPanel(value as PartnerDetailTabId)}
        className="flex-wrap"
        scrollClassName="flex-wrap"
      />

      <div className="pt-4">
        {panel === 'overview' ? <PartnerOverviewTab partner={partner} /> : null}
        {panel === 'commission' ? <PartnerCommissionPolicyCard partnerId={partner.id} /> : null}
        {panel === 'payouts' ? (
          <PartnerAccrualsCard partnerId={partner.id} reloadKey={accrualsReloadKey} />
        ) : null}
        {panel === 'outbound' ? (
          <PartnerOutboundServicesCard partnerId={partner.id} reloadKey={accrualsReloadKey} />
        ) : null}
        {panel === 'agreements' ? (
          <PartnerAgreementsCard partner={partner} onSaved={onPartnerUpdated} />
        ) : null}
        {panel === 'analytics' ? <PartnerAnalyticsCard partnerId={partner.id} /> : null}
      </div>
    </div>
  );
}
