'use client';

import { Plus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PAGE_HERO_PRIMARY_LABEL = 'Create';

export interface PageHeroPrimaryActionProps extends ComponentProps<typeof Button> {
  /** Accessible name; visible label is always "Create". */
  label: string;
}

/** Compact primary hero CTA — always shows "Create". */
export function PageHeroPrimaryAction({ label, className, ...props }: PageHeroPrimaryActionProps) {
  return (
    <Button
      type="button"
      size="sm"
      aria-label={label}
      className={cn('h-8 shrink-0 px-2.5 text-xs', className)}
      {...props}
    >
      <Plus className="size-4 shrink-0" aria-hidden />
      {PAGE_HERO_PRIMARY_LABEL}
    </Button>
  );
}
