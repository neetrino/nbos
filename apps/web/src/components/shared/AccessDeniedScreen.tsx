'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessDeniedScreenProps {
  title?: string;
  description?: string;
  showDashboardLink: boolean;
}

export function AccessDeniedScreen({
  title = 'Access restricted',
  description = 'You do not have permission to view this section. Contact your administrator if you need access.',
  showDashboardLink,
}: AccessDeniedScreenProps) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="bg-muted/60 flex size-20 items-center justify-center rounded-2xl">
        <Lock className="text-muted-foreground size-10" aria-hidden />
      </div>
      <h1 className="text-foreground mt-8 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {showDashboardLink ? (
          <Link href="/dashboard" className={cn(buttonVariants())}>
            Go to Dashboard
          </Link>
        ) : (
          <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }))}>
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
