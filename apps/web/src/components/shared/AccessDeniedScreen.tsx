'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessDeniedScreenProps {
  title?: string;
  description?: string;
  showDashboardLink: boolean;
}

export function AccessDeniedScreen({
  title,
  description,
  showDashboardLink,
}: AccessDeniedScreenProps) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-4 py-16">
      <div className="nbos-state-frame w-full max-w-xl">
        <p className="nbos-desk-kicker">{t('accessDenied.kicker')}</p>
        <div className="bg-muted mx-auto mt-5 flex size-16 items-center justify-center rounded-2xl">
          <Lock className="text-muted-foreground size-7" aria-hidden />
        </div>
        <h1 className="nbos-display text-foreground mt-6 text-3xl sm:text-4xl">
          {title ?? t('accessDenied.title')}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed">
          {description ?? t('accessDenied.description')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {showDashboardLink ? (
            <Link href="/dashboard" className={cn(buttonVariants())}>
              {t('accessDenied.goToDashboard')}
            </Link>
          ) : (
            <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }))}>
              {t('accessDenied.signIn')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
