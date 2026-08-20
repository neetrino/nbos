'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LeadDuplicateLookupResult } from '@/lib/api/leads';
import { LeadCandidateList } from './LeadDuplicateBannerRows';

export type LeadDuplicateBannerMode = 'create' | 'phone-add';

interface LeadDuplicateBannerProps {
  result: LeadDuplicateLookupResult;
  mode: LeadDuplicateBannerMode;
  onOpen: (leadId: string) => void;
  onMerge?: (leadId: string) => void;
  onDismiss?: () => void;
  onOpenContact?: (contactId: string) => void;
  onOpenDeal?: (dealId: string) => void;
}

export function LeadDuplicateBanner({
  result,
  mode,
  onOpen,
  onMerge,
  onDismiss,
  onOpenContact,
  onOpenDeal,
}: LeadDuplicateBannerProps) {
  if (!hasDuplicateHits(result)) return null;

  const hasOpenDeal = result.openDeals.length > 0 || result.leads.some((lead) => lead.hasOpenDeal);

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">{bannerTitle(mode)}</p>
          {hasOpenDeal ? (
            <p>This person already has an open Deal. Do not create a second Lead silently.</p>
          ) : null}
          <LeadCandidateList
            result={result}
            mode={mode}
            onOpen={onOpen}
            onMerge={onMerge}
            onOpenContact={onOpenContact}
            onOpenDeal={onOpenDeal}
          />
          {mode === 'create' ? (
            <p className="text-muted-foreground text-xs">
              Attach opens the existing card. Create anyway is still available below.
            </p>
          ) : null}
          {onDismiss ? (
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function hasDuplicateHits(result: LeadDuplicateLookupResult): boolean {
  return result.leads.length > 0 || result.contacts.length > 0 || result.openDeals.length > 0;
}

function bannerTitle(mode: LeadDuplicateBannerMode): string {
  if (mode === 'phone-add') {
    return 'Another open Lead uses this phone. Merge only if it is the same request.';
  }
  return 'Possible existing Lead, Contact, or open Deal for this person.';
}
