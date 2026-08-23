'use client';

import type { ReactNode } from 'react';
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

  if (!allowed) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        You do not have permission to view call activities.
      </p>
    );
  }

  return props.children;
}
