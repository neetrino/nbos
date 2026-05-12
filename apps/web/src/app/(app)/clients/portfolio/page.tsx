'use client';

import Link from 'next/link';
import { Users, Building2, LayoutDashboard } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PortfolioLandingPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-primary size-6" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight">Client Portfolio</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Open a computed 360° view from a contact or company row, or jump back to directory lists.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/clients/contacts"
          className={cn(buttonVariants({ variant: 'outline' }), 'justify-start gap-2')}
        >
          <Users size={16} />
          Browse contacts
        </Link>
        <Link
          href="/clients/companies"
          className={cn(buttonVariants({ variant: 'outline' }), 'justify-start gap-2')}
        >
          <Building2 size={16} />
          Browse companies
        </Link>
      </div>
    </div>
  );
}
