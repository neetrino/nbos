'use client';

import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type SheetSize = 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<SheetSize, string> = {
  md: 'w-full sm:w-[50vw]',
  lg: 'w-full sm:w-[70vw]',
  xl: 'w-full sm:w-[85vw]',
};

interface EntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  size?: SheetSize;
  className?: string;
}

export function EntitySheet({
  open,
  onOpenChange,
  title,
  description,
  badge,
  children,
  footer,
  side = 'right',
  size = 'lg',
  className,
}: EntitySheetProps) {
  const hasHeader = title || description || badge;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(className ?? SIZE_MAP[size], 'p-0')}>
        {hasHeader && (
          <SheetHeader className="space-y-1 px-8 pt-6">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg">{title}</SheetTitle>
              {badge}
            </div>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}

        <ScrollArea className="flex-1 px-8 py-6">{children}</ScrollArea>

        {footer && <div className="border-border mt-auto border-t px-8 py-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
