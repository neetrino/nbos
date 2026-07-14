'use client';

import { useEffect, useState } from 'react';
import {
  FINANCE_CALENDAR_FULL_TOTAL_MIN_VIEWPORT_PX,
  resolveFinanceCalendarPreferFullTotal,
} from '@/features/finance/constants/finance-calendar-total-display';

const FULL_TOTAL_MEDIA_QUERY = `(min-width: ${FINANCE_CALENDAR_FULL_TOTAL_MIN_VIEWPORT_PX}px)`;

function readWideViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(FULL_TOTAL_MEDIA_QUERY).matches;
}

/**
 * Prefer full Total amounts on wide viewports; otherwise follow sidebar
 * (collapsed → full, open → abbreviated).
 */
export function useFinanceCalendarPreferFullTotal(sidebarCollapsed: boolean): boolean {
  const [isWideViewport, setIsWideViewport] = useState(readWideViewport);

  useEffect(() => {
    const mq = window.matchMedia(FULL_TOTAL_MEDIA_QUERY);
    const sync = () => setIsWideViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return resolveFinanceCalendarPreferFullTotal(sidebarCollapsed, isWideViewport);
}
