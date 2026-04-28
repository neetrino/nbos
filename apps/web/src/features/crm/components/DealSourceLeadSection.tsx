'use client';

import { ExternalLink, Link2, User } from 'lucide-react';
import type { Deal } from '@/lib/api/deals';

interface DealSourceLeadSectionProps {
  deal: Deal;
}

export function DealSourceLeadSection({ deal }: DealSourceLeadSectionProps) {
  if (!deal.lead) return null;

  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Link2 size={12} />
        Source Lead
      </h4>
      <div className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <User size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{deal.lead.contactName}</p>
          <p className="text-muted-foreground text-xs">{deal.lead.code}</p>
        </div>
        <ExternalLink size={14} className="text-muted-foreground" />
      </div>
    </section>
  );
}
