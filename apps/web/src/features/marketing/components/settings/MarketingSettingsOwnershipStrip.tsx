'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface MarketingSettingsSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function MarketingSettingsSectionHeader({
  title,
  description,
  action,
}: MarketingSettingsSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl min-w-0">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function MarketingSettingsOwnershipStrip() {
  const t = useTranslations('marketing');
  const items = [
    {
      title: t('settings.ownership.marketingTitle'),
      body: t('settings.ownership.marketingBody'),
    },
    {
      title: t('settings.ownership.crmTitle'),
      body: t('settings.ownership.crmBody'),
    },
    {
      title: t('settings.ownership.financeTitle'),
      body: t('settings.ownership.financeBody'),
    },
  ];

  return (
    <section className="space-y-3">
      <p className="text-muted-foreground text-sm">{t('settings.purpose')}</p>
      <dl className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="min-w-0">
            <dt className="text-foreground text-xs font-semibold tracking-wide uppercase">
              {item.title}
            </dt>
            <dd className="text-muted-foreground mt-1 text-sm leading-snug">{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
