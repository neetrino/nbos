'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MarketingCrmWhereOption } from '@/lib/api/marketing';
import { MARKETING_SETTINGS_MAP_STACK_CLASS } from '@/features/marketing/constants/marketing-settings-surface';
import { resolveMarketingChannelOrder } from '@/features/marketing/utils/group-marketing-accounts-by-channel';
import { MarketingCrmWhereListSheet } from './MarketingCrmWhereListSheet';
import { MarketingCrmWhereSheet } from './MarketingCrmWhereSheet';
import { MarketingSettingsMapRow } from './MarketingSettingsMapRow';

interface MarketingCrmWhereSectionProps {
  rows: MarketingCrmWhereOption[];
  canEdit: boolean;
  onSaved: () => Promise<void>;
}

export function MarketingCrmWhereSection({
  rows,
  canEdit,
  onSaved,
}: MarketingCrmWhereSectionProps) {
  const t = useTranslations('marketing');
  const [listOpen, setListOpen] = useState(false);
  const [openChannel, setOpenChannel] = useState<string | null>(null);
  const orderedRows = orderCrmWhereRows(rows);
  const selected = rows.find((row) => row.channel === openChannel) ?? null;
  const activeCount = rows.filter((row) => row.isActive).length;

  return (
    <section className={MARKETING_SETTINGS_MAP_STACK_CLASS}>
      <MarketingSettingsMapRow
        title={t('settings.crmWhere.title')}
        description={t('settings.crmWhere.description')}
        countLabel={`${t('settings.crmWhere.channelCount', { count: rows.length })} · ${t(
          'settings.crmWhere.activeCount',
          { count: activeCount },
        )}`}
        onOpen={() => setListOpen(true)}
      />
      <MarketingCrmWhereListSheet
        rows={orderedRows}
        open={listOpen}
        onOpenChange={(open) => {
          setListOpen(open);
          if (!open) setOpenChannel(null);
        }}
        onOpenRow={(row) => setOpenChannel(row.channel)}
      />
      <MarketingCrmWhereSheet
        row={selected}
        open={selected != null}
        canEdit={canEdit}
        onOpenChange={(open) => {
          if (!open) setOpenChannel(null);
        }}
        onSaved={onSaved}
      />
    </section>
  );
}

function orderCrmWhereRows(rows: MarketingCrmWhereOption[]): MarketingCrmWhereOption[] {
  const order = resolveMarketingChannelOrder(rows);
  return order
    .map((channel) => rows.find((row) => row.channel === channel))
    .filter((row): row is MarketingCrmWhereOption => row != null);
}
