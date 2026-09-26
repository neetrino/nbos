'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleHeroSlotProvider } from '@/components/shared/page-hero';

export default function VideoMeetingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('videoMeetings');

  return (
    <ModuleHeroSlotProvider
      title={t('title')}
      className="flex h-full min-h-0 w-full min-w-0 flex-col gap-5"
    >
      {children}
    </ModuleHeroSlotProvider>
  );
}
