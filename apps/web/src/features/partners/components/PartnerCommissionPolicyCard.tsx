'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEAL_TYPES } from '@/features/crm/constants/dealPipeline';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { PartnerDetailCardFrame } from './PartnerDetailCardFrame';
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
  const policyRef = useRef(policy);
  policyRef.current = policy;
  const loadedPartnerIdRef = useRef<string | null>(null);
  const [loadedPartnerId, setLoadedPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Record<PartnerCommissionDealType, string>>>({});
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    beginLoad(loadedPartnerIdRef.current === partnerId && policyRef.current != null);
    setError(null);
    try {
      const data = await partnersApi.getCommissionPolicy(partnerId);
      setPolicy(data);
      loadedPartnerIdRef.current = partnerId;
      setLoadedPartnerId(partnerId);
      const nextDraft: Partial<Record<PartnerCommissionDealType, string>> = {};
      for (const row of data.rows) {
        nextDraft[row.dealType] = row.percent ?? '';
      }
      setDraft(nextDraft);
    } catch (caught) {
      if (isAccessRevokedApiError(caught) || loadedPartnerIdRef.current !== partnerId) {
        setPolicy(null);
        loadedPartnerIdRef.current = null;
        setLoadedPartnerId(null);
      }
      setError(getApiErrorMessage(caught, 'Commission policy could not be loaded.'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, partnerId]);

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

  return (
    <PartnerDetailCardFrame
      loading={loading}
      error={error}
      hasData={loadedPartnerId === partnerId && policy != null}
      loadingLabel="Loading commission policy…"
      onRetry={() => void load()}
      onDismissError={() => setError(null)}
    >
      {policy ? (
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
                  <div key={dt.value} className="space-y-1.5">
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
      ) : null}
    </PartnerDetailCardFrame>
  );
}
