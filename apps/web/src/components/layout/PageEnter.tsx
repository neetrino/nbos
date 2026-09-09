'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageEnterProps {
  children: ReactNode;
  className?: string;
}

export function PageEnter({ children, className }: PageEnterProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={cn('nbos-page-enter flex min-h-0 min-w-0 flex-1 flex-col', className)}
    >
      {children}
    </div>
  );
}
