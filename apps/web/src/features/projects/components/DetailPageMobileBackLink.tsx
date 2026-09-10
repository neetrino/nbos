'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';

/** Matches sheet floating Back chrome on mobile detail pages. */
export const DETAIL_PAGE_MOBILE_BACK_LINK_CLASS =
  'bg-primary text-primary-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full shadow-md transition-colors hover:bg-primary/90';

interface DetailPageMobileBackLinkProps {
  href: string;
  ariaLabel: string;
  className?: string;
}

/** Circular primary Back — mobile only, placed before the entity title. */
export function DetailPageMobileBackLink({
  href,
  ariaLabel,
  className,
}: DetailPageMobileBackLinkProps) {
  const isMobileViewport = useIsMobileViewport();
  if (!isMobileViewport) return null;

  return (
    <Link
      href={href}
      className={cn(DETAIL_PAGE_MOBILE_BACK_LINK_CLASS, className)}
      aria-label={ariaLabel}
    >
      <ChevronLeft className="size-4" aria-hidden />
    </Link>
  );
}
