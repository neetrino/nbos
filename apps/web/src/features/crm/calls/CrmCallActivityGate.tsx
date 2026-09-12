'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { usePermission } from '@/lib/permissions';

export function CrmCallActivityGate(props: {
  parent: 'lead' | 'contact' | 'deal';
  children: ReactNode;
}) {
  const { can } = usePermission();
  const allowed =
    props.parent === 'deal'
      ? can('VIEW', 'CRM_DEALS')
      : props.parent === 'lead'
        ? can('VIEW', 'CRM_LEADS')
        : can('VIEW', 'CRM_LEADS') || can('VIEW', 'CRM_DEALS');

  const t = useTranslations('crm');
  if (!allowed) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">{t('call.noPermission')}</p>
    );
  }

  return props.children;
}
