'use client';

import { useState } from 'react';
import { BarChart3, FileText, Handshake, LayoutGrid, Percent, Wallet } from 'lucide-react';
import {
  DETAIL_SHEET_TAB_ACTIVE_CLASS,
  DETAIL_SHEET_TAB_BAR_SCROLL_CLASS,
  DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS,
  DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
  DETAIL_SHEET_TAB_INACTIVE_CLASS,
  DETAIL_SHEET_TAB_INDICATOR_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
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

const TABS: Array<{
  id: PartnerDetailTabId;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'commission', label: 'Commission', icon: Percent },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'outbound', label: 'Outbound', icon: Handshake },
  { id: 'agreements', label: 'Agreement', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function PartnerDetailTabs(props: {
  partner: Partner;
  onPartnerUpdated: (p: Partner) => void;
  accrualsReloadKey: number;
}) {
  const { partner, onPartnerUpdated, accrualsReloadKey } = props;
  const [panel, setPanel] = useState<PartnerDetailTabId>('overview');

  return (
    <div className="w-full">
      <div className={cn(DETAIL_SHEET_TAB_BAR_WRAPPER_CLASS, 'flex-wrap')}>
        <div className={cn(DETAIL_SHEET_TAB_BAR_SCROLL_CLASS, 'flex-wrap')}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = panel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                className={cn(
                  DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
                  'px-4 sm:px-5',
                  active ? DETAIL_SHEET_TAB_ACTIVE_CLASS : DETAIL_SHEET_TAB_INACTIVE_CLASS,
                )}
              >
                <Icon size={16} aria-hidden />
                {tab.label}
                {active ? <span className={DETAIL_SHEET_TAB_INDICATOR_CLASS} /> : null}
              </button>
            );
          })}
        </div>
      </div>

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
