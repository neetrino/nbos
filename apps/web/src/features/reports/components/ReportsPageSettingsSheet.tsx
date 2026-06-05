'use client';

import type { ReactNode } from 'react';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface ReportsPageSettingsSheetProps {
  title: string;
  description: string;
  triggerAriaLabel: string;
  children: ReactNode;
}

export function ReportsPageSettingsSheet({
  title,
  description,
  triggerAriaLabel,
  children,
}: ReportsPageSettingsSheetProps) {
  return (
    <PageSettingsSheet title={title} description={description} triggerAriaLabel={triggerAriaLabel}>
      {children}
    </PageSettingsSheet>
  );
}
