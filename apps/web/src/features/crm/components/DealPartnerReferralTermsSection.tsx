'use client';

import { useState } from 'react';
import { Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-errors';
import { dealsApi, type Deal } from '@/lib/api/deals';

const OVERRIDE_REASON_MIN = 3;

function formatPercent(value: number | string): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(2);
}

export function DealPartnerReferralTermsSection(props: {
  deal: Deal;
  attributionLocked: boolean;
  onTermsUpdated?: () => void;
}) {
  const { deal, attributionLocked, onTermsUpdated } = props;
  const [percentDraft, setPercentDraft] = useState('');
  const [reasonDraft, setReasonDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terms = deal.partnerReferralTerms;

  const handleReset = async () => {
    setError(null);
    setBusy(true);
    try {
      await dealsApi.patchPartnerReferralTerms(deal.id, { mode: 'RESET' });
      onTermsUpdated?.();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not reset referral terms.'));
    } finally {
      setBusy(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pct = Number.parseFloat(percentDraft.replace(',', '.'));
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError('Partner percent must be a number from 0 to 100.');
      return;
    }
    const reason = reasonDraft.trim();
    if (reason.length < OVERRIDE_REASON_MIN) {
      setError(`Reason must be at least ${OVERRIDE_REASON_MIN} characters.`);
      return;
    }
    setBusy(true);
    try {
      await dealsApi.patchPartnerReferralTerms(deal.id, {
        mode: 'OVERRIDE',
        partnerPercent: pct,
        overrideReason: reason,
      });
      setPercentDraft('');
      setReasonDraft('');
      onTermsUpdated?.();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not save override.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="col-span-2 mt-2 rounded-xl border border-dashed border-stone-100 p-4 dark:border-stone-800">
      <h5 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <Percent size={12} />
        Partner referral terms
      </h5>
      {!terms ? (
        <p className="text-muted-foreground text-sm">
          Frozen commission terms will appear after you save the deal with this partner and deal
          type.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-foreground font-semibold">
              {formatPercent(terms.partnerPercent)}%
            </span>
            <span className="text-muted-foreground">
              source: <span className="text-foreground font-medium">{terms.sourcePolicy}</span>
            </span>
            <span className="text-muted-foreground">
              deal type: <span className="text-foreground font-medium">{terms.dealType}</span>
            </span>
            {terms.paymentType ? (
              <span className="text-muted-foreground">
                payment: <span className="text-foreground font-medium">{terms.paymentType}</span>
              </span>
            ) : null}
          </div>
          {terms.sourcePolicy === 'OVERRIDE' && terms.overrideReason ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Override reason: {terms.overrideReason}
            </p>
          ) : null}
          {!attributionLocked ? (
            <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleReset()}
              >
                Recalculate from policy
              </Button>
              <form
                className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md"
                onSubmit={(e) => void handleOverride(e)}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`partner-ref-pct-${deal.id}`} className="text-xs">
                      Override %
                    </Label>
                    <Input
                      id={`partner-ref-pct-${deal.id}`}
                      inputMode="decimal"
                      placeholder="e.g. 12.5"
                      value={percentDraft}
                      onChange={(ev) => setPercentDraft(ev.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`partner-ref-reason-${deal.id}`} className="text-xs">
                    Reason (required)
                  </Label>
                  <Input
                    id={`partner-ref-reason-${deal.id}`}
                    placeholder="Why this % differs from policy"
                    value={reasonDraft}
                    onChange={(ev) => setReasonDraft(ev.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={busy}>
                  Save override
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Referral terms are locked while the deal is in a closed pipeline stage.
            </p>
          )}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
