'use client';

import { useEffect, useState } from 'react';
import { BarChart3, FileText, Handshake, LayoutGrid, Percent, Wallet } from 'lucide-react';
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

  useEffect(() => {
    setPanel('overview');
  }, [partner.id]);

  return (
    <div className="w-full">
      <div className="border-border shrink-0 border-b border-stone-100 px-5 dark:border-stone-800">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = panel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors sm:px-5',
                  active
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                    : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300',
                )}
              >
                <Icon size={16} aria-hidden />
                {tab.label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
                ) : null}
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
