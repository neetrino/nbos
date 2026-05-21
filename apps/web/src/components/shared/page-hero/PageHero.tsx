'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  PAGE_HERO_SEARCH_CENTER,
  PAGE_HERO_SURFACE,
  PAGE_HERO_TAB_SCROLL,
} from './page-hero-constants';

export interface PageHeroProps {
  title: string;
  tabs?: ReactNode;
  search?: ReactNode;
  secondaryTabs?: ReactNode;
  viewMode?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function PageHero({
  title,
  tabs,
  search,
  secondaryTabs,
  viewMode,
  actions,
  trailing,
  className,
}: PageHeroProps) {
  const hasTrailing = Boolean(viewMode || actions || trailing);
  const hasSearch = Boolean(search);

  return (
    <section className={cn(PAGE_HERO_SURFACE, className)}>
      <div
        className={cn(
          'grid min-w-0 items-center gap-3 sm:gap-4',
          hasSearch && hasTrailing
            ? 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]'
            : hasSearch
              ? 'grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)]'
              : hasTrailing
                ? 'grid-cols-1 sm:grid-cols-[auto_auto]'
                : 'grid-cols-1',
        )}
      >
        <div className="flex min-w-0 items-center gap-3 sm:col-start-1 sm:row-start-1 sm:gap-4">
          <h1 className="text-foreground shrink-0 text-xl font-semibold tracking-tight">{title}</h1>
          {tabs ? <div className={cn(PAGE_HERO_TAB_SCROLL, 'shrink-0')}>{tabs}</div> : null}
        </div>
        {hasSearch ? (
          <div className="w-full min-w-0 sm:col-start-2">
            <div className={PAGE_HERO_SEARCH_CENTER}>{search}</div>
          </div>
        ) : null}
        {hasTrailing ? (
          <HeroTrailingActions
            viewMode={viewMode}
            actions={actions}
            trailing={trailing}
            className={cn(
              hasSearch ? 'sm:col-start-3 sm:row-start-1 sm:justify-self-end' : 'sm:ml-auto',
            )}
          />
        ) : null}
      </div>
      {secondaryTabs ? (
        <div className={cn('mt-3', PAGE_HERO_TAB_SCROLL)}>{secondaryTabs}</div>
      ) : null}
    </section>
  );
}

function HeroTrailingActions({
  viewMode,
  actions,
  trailing,
  className,
}: {
  viewMode?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto',
        className,
      )}
    >
      {viewMode}
      {actions}
      {trailing}
    </div>
  );
}
