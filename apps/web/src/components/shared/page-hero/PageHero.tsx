'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PAGE_HERO_SURFACE, PAGE_HERO_TAB_SCROLL } from './page-hero-constants';

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

  return (
    <section className={cn(PAGE_HERO_SURFACE, className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
          <h1 className="text-foreground shrink-0 text-xl font-semibold tracking-tight">{title}</h1>
          {tabs ? <div className={PAGE_HERO_TAB_SCROLL}>{tabs}</div> : null}
        </div>
        {search ? <HeroSearchSlot>{search}</HeroSearchSlot> : null}
        {hasTrailing ? (
          <HeroTrailingActions viewMode={viewMode} actions={actions} trailing={trailing} />
        ) : null}
      </div>
      {secondaryTabs ? (
        <div className={cn('mt-3', PAGE_HERO_TAB_SCROLL)}>{secondaryTabs}</div>
      ) : null}
    </section>
  );
}

function HeroSearchSlot({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 flex-1 basis-full sm:basis-0 sm:px-1">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

function HeroTrailingActions({
  viewMode,
  actions,
  trailing,
}: {
  viewMode?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="ml-auto flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
      {viewMode}
      {actions}
      {trailing}
    </div>
  );
}
