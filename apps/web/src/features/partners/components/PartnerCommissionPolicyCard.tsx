'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEAL_TYPES } from '@/features/crm/constants/dealPipeline';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  partnersApi,
  type PartnerCommissionDealType,
  type PartnerCommissionPolicy,
} from '@/lib/api/partners';

function parseRowPercent(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number.parseFloat(trimmed.replace(',', '.'));
  if (Number.isNaN(n) || n < 0 || n > 100) return 'invalid';
  return n;
}

export function PartnerCommissionPolicyCard(props: { partnerId: string }) {
  const { partnerId } = props;
  const [policy, setPolicy] = useState<PartnerCommissionPolicy | null>(null);
  const [draft, setDraft] = useState<Partial<Record<PartnerCommissionDealType, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.getCommissionPolicy(partnerId);
      setPolicy(data);
      const nextDraft: Partial<Record<PartnerCommissionDealType, string>> = {};
      for (const row of data.rows) {
        nextDraft[row.dealType] = row.percent ?? '';
      }
      setDraft(nextDraft);
    } catch (caught) {
      setPolicy(null);
      setError(getApiErrorMessage(caught, 'Commission policy could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setFormError(null);
    const rows: Array<{ dealType: PartnerCommissionDealType; percent: number | null }> = [];
    for (const dt of DEAL_TYPES) {
      const dealType = dt.value as PartnerCommissionDealType;
      const raw = draft[dealType] ?? '';
      const parsed = parseRowPercent(raw);
      if (parsed === 'invalid') {
        setFormError('Each percent must be empty (use default) or a number from 0 to 100.');
        return;
      }
      rows.push({ dealType, percent: parsed });
    }

    setSaving(true);
    try {
      const updated = await partnersApi.putCommissionPolicy(partnerId, { rows });
      setPolicy(updated);
      setFormError(null);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Commission policy could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm">Loading commission policy…</p>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-destructive text-sm" role="alert">
          {error ?? 'No policy data.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Commission policy</h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Percent by deal type (NBOS). Empty field uses partner default{' '}
        <span className="tabular-nums">{policy.fallbackPercent}%</span>. Payment type does not
        change these rates.
      </p>

      <form onSubmit={handleSave} className="mt-4 space-y-3">
        {formError ? (
          <p className="text-destructive text-sm" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {DEAL_TYPES.map((dt) => {
            const raw = draft[dt.value as PartnerCommissionDealType] ?? '';
            const parsed = parseRowPercent(raw);
            return (
              <div key={dt.value}>
                <Label htmlFor={`policy-${dt.value}`}>{dt.label}</Label>
                <Input
                  id={`policy-${dt.value}`}
                  inputMode="decimal"
                  placeholder={`Default (${policy.fallbackPercent}%)`}
                  value={raw}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [dt.value]: e.target.value,
                    }))
                  }
                  aria-invalid={raw.trim() !== '' && parsed === 'invalid'}
                  className="mt-1"
                />
              </div>
            );
          })}
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save policy'}
        </Button>
      </form>
    </div>
  );
}
