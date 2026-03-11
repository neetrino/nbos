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

interface EntitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
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
  className,
}: EntitySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className ?? 'w-full sm:max-w-[540px]'}>
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            {badge}
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <ScrollArea className="-mx-6 mt-6 flex-1 px-6">{children}</ScrollArea>

        {footer && <div className="border-border mt-auto border-t pt-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
