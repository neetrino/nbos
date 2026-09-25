'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { EntityDetailSheetContent, InlineField } from '@/components/shared';
import { KpiPolicyEditorCard } from '@/features/my-company/kpi-policies/kpi-policy-editor-card';
import { KpiGateBandEditor } from '@/features/my-company/kpi-policies/kpi-gate-band-editor';
import {
  DEFAULT_GATE_BAND_DRAFTS,
  parseDraftsToRules,
  type KpiGateBandDraft,
} from '@/features/my-company/kpi-policies/kpi-gate-band-utils';
import {
  KpiPolicyCapField,
  parseCapMultiplierDraft,
} from '@/features/my-company/kpi-policies/kpi-policy-cap-field';
import { KPI_POLICY_CAP_MULTIPLIER_DEFAULT } from '@/features/my-company/kpi-policies/kpi-policy-cap.constants';
import { DEFAULT_SALES_SCORECARD_METRICS } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';
import {
  KpiPolicyTargetField,
  parseTargetAmountDraft,
} from '@/features/my-company/kpi-policies/kpi-policy-target-field';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_HEADER_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import { kpiPoliciesApi, type KpiPolicyRow } from '@/lib/api/kpi-policies';

export function KpiPolicySheet({
  policy,
  open,
  onOpenChange,
  onSaved,
}: {
  policy: KpiPolicyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: KpiPolicyRow) => void;
}) {
  const title = policy == null ? 'New KPI gate' : policy.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        sourcePageHref="/my-company/kpi-policies"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className={TEAM_SHEET_HEADER_CLASS}>
            <h2 className="truncate text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Attainment bands scale a sales bonus. Assign the gate on a salary.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={TEAM_SHEET_BODY_CLASS}>
              {policy == null ? (
                <KpiPolicyCreateForm
                  onCreated={(row) => {
                    onSaved(row);
                    onOpenChange(false);
                  }}
                />
              ) : (
                <KpiPolicyEditForm
                  policy={policy}
                  onSaved={(row) => {
                    onSaved(row);
                    onOpenChange(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function KpiPolicyEditForm({
  policy,
  onSaved,
}: {
  policy: KpiPolicyRow;
  onSaved: (row: KpiPolicyRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error ? <p className="text-destructive mb-3 text-xs">{error}</p> : null}
      <KpiPolicyEditorCard
        policy={policy}
        saving={saving}
        onSave={async (id, payload) => {
          setSaving(true);
          setError(null);
          try {
            onSaved(await kpiPoliciesApi.update(id, payload));
          } catch {
            setError('Save failed. Check bands (0–100) and try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

function KpiPolicyCreateForm({ onCreated }: { onCreated: (row: KpiPolicyRow) => void }) {
  const [name, setName] = useState('');
  const [bands, setBands] = useState<KpiGateBandDraft[]>(DEFAULT_GATE_BAND_DRAFTS);
  const [capMultiplier, setCapMultiplier] = useState(String(KPI_POLICY_CAP_MULTIPLIER_DEFAULT));
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const gateRules = parseDraftsToRules(bands);
    const cap = parseCapMultiplierDraft(capMultiplier);
    const target = parseTargetAmountDraft(targetAmount);
    if (gateRules == null || cap == null || name.trim().length < 2) {
      setError('Enter a name, a cap from 1 to 3, and valid bands.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await kpiPoliciesApi.create({
        name: name.trim(),
        gateRules,
        scorecardMetrics: DEFAULT_SALES_SCORECARD_METRICS,
        targetAmount: target,
        targetSource: 'MANUAL_POLICY',
        resultSource: 'SALES_PAYMENTS',
        bonusCapBaseSalaryMultiplier: cap,
        scope: 'COMPANY',
      });
      onCreated(created);
    } catch {
      setError('Could not create policy.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <InlineField
        variant="controlled"
        label="Name"
        value={name}
        placeholder="Seller KPI gate Q2"
        disabled={creating}
        onValueChange={setName}
        className="mb-3"
      />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <KpiPolicyCapField value={capMultiplier} disabled={creating} onChange={setCapMultiplier} />
        <KpiPolicyTargetField value={targetAmount} disabled={creating} onChange={setTargetAmount} />
      </div>
      <KpiGateBandEditor bands={bands} onChange={setBands} disabled={creating} />
      {error ? <p className="text-destructive mt-3 text-xs">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" disabled={creating} onClick={() => void create()}>
          {creating ? 'Creating…' : 'Create policy'}
        </Button>
      </div>
    </div>
  );
}
