'use client';

import type { ReactElement } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatAmountThousandsDram } from '@/features/finance/constants/finance';
import { cn } from '@/lib/utils';

const AMOUNT_HOVER_OPEN_DELAY_MS = 0;

export function SubscriptionAmountHover({
  amount,
  children,
  className,
  trigger,
}: {
  amount: number;
  children: React.ReactNode;
  className?: string;
  trigger?: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={AMOUNT_HOVER_OPEN_DELAY_MS}
        className={cn('w-full', className)}
        render={trigger ?? <div />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{formatAmountThousandsDram(amount)}</TooltipContent>
    </Tooltip>
  );
}
