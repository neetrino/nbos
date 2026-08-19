'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LeadDuplicateLookupResult } from '@/lib/api/leads';

export type LeadDuplicateBannerMode = 'create' | 'phone-add';

interface LeadDuplicateBannerProps {
  result: LeadDuplicateLookupResult;
  mode: LeadDuplicateBannerMode;
  onOpen: (leadId: string) => void;
  onMerge?: (leadId: string) => void;
  onDismiss?: () => void;
}

export function LeadDuplicateBanner({
  result,
  mode,
  onOpen,
  onMerge,
  onDismiss,
}: LeadDuplicateBannerProps) {
  if (result.leads.length === 0 && result.openDeals.length === 0) return null;

  const hasOpenDeal = result.openDeals.length > 0 || result.leads.some((lead) => lead.hasOpenDeal);

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">
            {mode === 'phone-add'
              ? 'Another open Lead uses this phone. Merge only if it is the same request.'
              : 'Possible existing Lead or open Deal for this person.'}
          </p>
          {hasOpenDeal ? (
            <p>This person already has an open Deal. Do not create a second Lead silently.</p>
          ) : null}
          <ul className="space-y-2">
            {result.leads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {lead.code}
                    {lead.name ? ` · ${lead.name}` : ''}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {lead.contactName}
                    {lead.status === 'SPAM' ? ' · Spam (not auto-attached)' : ''}
                    {lead.hasOpenDeal && lead.deal ? ` · Deal ${lead.deal.code}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpen(lead.id)}>
                    Open
                  </Button>
                  {mode === 'create' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onOpen(lead.id)}
                    >
                      Attach
                    </Button>
                  ) : null}
                  {mode === 'phone-add' && onMerge && lead.isOpenForAttach && !lead.hasOpenDeal ? (
                    <Button type="button" size="sm" onClick={() => onMerge(lead.id)}>
                      Merge
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
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
