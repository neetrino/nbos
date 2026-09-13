'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingState } from '@/components/shared';

interface QuickActionShellProps {
  form: ReactNode;
  background: ReactNode;
  showBackground: boolean;
  backgroundPending: boolean;
}

export function QuickActionShell({
  form,
  background,
  showBackground,
  backgroundPending,
}: QuickActionShellProps) {
  const t = useTranslations('quick');

  return (
    <div className="bg-background text-foreground min-h-dvh">
      {form}
      <div className={showBackground ? 'h-dvh overflow-auto px-4 py-5 sm:px-6' : 'hidden'}>
        {backgroundPending ? (
          <div className="flex min-h-[50dvh] items-center justify-center">
            <LoadingState />
            <span className="sr-only">{t('task.backgroundLoading')}</span>
          </div>
        ) : (
          background
        )}
      </div>
    </div>
  );
}
