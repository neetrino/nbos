'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Building2 } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/shared';

interface MyCompanyPlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function MyCompanyPlaceholder({
  title,
  description,
  icon: Icon = Building2,
}: MyCompanyPlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Icon}
        title={`${title} is not configured yet`}
        description="This section is part of My Company canon and will be implemented without blocking the current navigation shell."
        action={
          <Link
            href="/my-company"
            className="border-border bg-background hover:bg-muted inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors"
          >
            Back to Org Structure
            <ArrowRight size={16} />
          </Link>
        }
      />
    </div>
  );
}
