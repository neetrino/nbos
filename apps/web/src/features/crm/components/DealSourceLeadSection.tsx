'use client';

import { ExternalLink, Link2, User } from 'lucide-react';
import { DETAIL_SHEET_PERSON_AVATAR_CLASS, DetailSheetSection } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Deal } from '@/lib/api/deals';

interface DealSourceLeadSectionProps {
  deal: Deal;
  className?: string;
}

export function DealSourceLeadSection({ deal, className }: DealSourceLeadSectionProps) {
  if (!deal.lead) return null;

  return (
    <DetailSheetSection title="Source Lead" icon={<Link2 size={12} />} className={className}>
      <div className="border-border bg-muted/20 hover:bg-muted/40 flex items-center gap-3 rounded-xl border p-3 transition-colors">
        <div className={cn(DETAIL_SHEET_PERSON_AVATAR_CLASS, 'size-10 rounded-xl')}>
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
