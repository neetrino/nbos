'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DetailSheetCollapsibleSection } from '@/components/shared';
import type { Deal } from '@/lib/api/deals';

interface LegacyRow {
  label: string;
  value: string;
}

function collectLegacyRows(deal: Deal): LegacyRow[] {
  const rows: LegacyRow[] = [];
  const push = (label: string, value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) rows.push({ label, value: trimmed });
  };

  push('Offer sent date', deal.offerSentAt?.slice(0, 10) ?? null);
  push('Offer link', deal.offerLink);
  push('Offer file URL', deal.offerFileUrl);
  push('Offer screenshot URL', deal.offerScreenshotUrl);
  push('Contract signed date', deal.contractSignedAt?.slice(0, 10) ?? null);
  push('Contract file URL', deal.contractFileUrl);

  return rows;
}

interface DealLegacyFieldsPanelProps {
  deal: Deal;
}

/**
 * Read-only audit of DB fields removed from the main deal card (cleanup reference).
 */
export function DealLegacyFieldsPanel({ deal }: DealLegacyFieldsPanelProps) {
  const rows = collectLegacyRows(deal);
  const [open, setOpen] = useState(rows.length > 0);

  return (
    <DetailSheetCollapsibleSection
      title="Legacy stored fields"
      icon={<Archive size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
        These values live in the database but are not edited on the card. Workflow proof uses Drive
        Offer / Contract files. Clear or migrate rows here before removing columns.
      </p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">No legacy field values on this deal.</p>
      ) : (
        <dl className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="border-border/60 bg-muted/20 rounded-lg border px-3 py-2"
            >
              <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                {row.label}
              </dt>
              <dd className="text-foreground mt-1 text-xs break-all">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </DetailSheetCollapsibleSection>
  );
}
