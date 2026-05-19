'use client';

import { ExternalLink, Link2, User } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';

interface DealSourceLeadSectionProps {
  deal: Deal;
}

export function DealSourceLeadSection({ deal }: DealSourceLeadSectionProps) {
  if (!deal.lead) return null;

  return (
    <DetailSheetSection title="Source Lead" icon={<Link2 size={12} />}>
      <div className="border-border bg-muted/20 hover:bg-muted/40 flex items-center gap-3 rounded-xl border p-3 transition-colors">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <User size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{deal.lead.contactName}</p>
          <p className="text-muted-foreground text-xs">{deal.lead.code}</p>
        </div>
        <ExternalLink size={14} className="text-muted-foreground" />
      </div>
    </DetailSheetSection>
  );
}
