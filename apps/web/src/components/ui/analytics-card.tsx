'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ANALYTICS_BAR_DURATION_S = 0.8;
const ANALYTICS_BAR_STAGGER_S = 0.1;
const ANALYTICS_BAR_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LINK_BAR_HEIGHT_PERCENT = 18;
const MIN_QUANTITY_BAR_HEIGHT_PERCENT = 8;

export interface AnalyticsBarItem {
  label: string;
  quantity: number;
  displayValue?: string;
  href?: string;
}

export interface AnalyticsCardProps {
  title: string;
  totalAmount: string;
  icon: ReactNode;
  data: AnalyticsBarItem[];
  className?: string;
  locale?: string;
}

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

function barHeightPercent(item: AnalyticsBarItem, maxQuantity: number): number {
  if (item.displayValue !== undefined) return LINK_BAR_HEIGHT_PERCENT;
  if (item.quantity <= 0) return 0;
  const basis = Math.max(maxQuantity, 1);
  return Math.max(MIN_QUANTITY_BAR_HEIGHT_PERCENT, (item.quantity / basis) * 100);
}

function barDisplayValue(item: AnalyticsBarItem, locale?: string): string {
  if (item.displayValue !== undefined) return item.displayValue;
  return item.quantity.toLocaleString(locale);
}

/**
 * Analytics card with animated bar chart (dashboard mini analytics layout).
 */
export function AnalyticsCard({
  title,
  totalAmount,
  icon,
  data = [],
  className,
  locale,
}: AnalyticsCardProps) {
  const numericItems = data.filter((item) => item.displayValue === undefined);
  const maxQuantity = Math.max(...numericItems.map((item) => item.quantity), 0);
  const colClass = GRID_COLS_CLASS[Math.min(Math.max(data.length, 1), 5)] ?? 'grid-cols-5';

  return (
    <div className={cn('nbos-desk-surface text-card-foreground w-full p-5 sm:p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="nbos-desk-kicker">Pulse</p>
          <h3 className="mt-1 text-base font-semibold">{title}</h3>
        </div>
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          {icon}
        </div>
      </div>

      <div className="my-5">
        <h2 className="nbos-display text-4xl tabular-nums sm:text-5xl">{totalAmount}</h2>
      </div>

      <div className={cn('grid gap-4', colClass)} aria-label="Mini analytics chart">
        {data.map((item, index) => {
          const height = barHeightPercent(item, maxQuantity);
          const isPeak =
            item.displayValue === undefined && item.quantity === maxQuantity && maxQuantity > 0;
          const labelNode = (
            <span className="text-muted-foreground line-clamp-2 text-center text-sm">
              {item.label}
            </span>
          );

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-0 flex-col items-center gap-2"
            >
              <div
                className="bg-muted/50 relative flex h-32 w-full items-end overflow-hidden rounded-xl"
                role="presentation"
              >
                <motion.div
                  className={cn(
                    'relative flex w-full items-center justify-center rounded-t-md p-2',
                    isPeak ? 'bg-primary' : 'bg-primary/40',
                  )}
                  initial={{ height: '0%' }}
                  animate={{ height: `${height}%` }}
                  transition={{
                    duration: ANALYTICS_BAR_DURATION_S,
                    delay: index * ANALYTICS_BAR_STAGGER_S,
                    ease: ANALYTICS_BAR_EASE,
                  }}
                  aria-label={`${item.label}: ${barDisplayValue(item, locale)}`}
                  aria-valuenow={item.quantity}
                  aria-valuemin={0}
                  aria-valuemax={maxQuantity}
                >
                  {height > 0 ? (
                    <>
                      <div className="bg-background/50 absolute top-1.5 left-1/2 h-1 w-1/3 -translate-x-1/2 rounded-full" />
                      <span
                        className={cn(
                          'text-primary-foreground px-0.5 text-center text-xs leading-tight font-semibold',
                          item.displayValue !== undefined && 'text-[10px]',
                        )}
                      >
                        {barDisplayValue(item, locale)}
                      </span>
                    </>
                  ) : null}
                </motion.div>
              </div>
              {item.href ? (
                <Link href={item.href} className="hover:text-primary w-full transition-colors">
                  {labelNode}
                </Link>
              ) : (
                labelNode
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
