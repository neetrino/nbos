'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared';
import type { KpiPolicyRow } from '@/lib/api/kpi-policies';
import { KpiGateBandEditor } from './kpi-gate-band-editor';
import { parseDraftsToRules, rulesToDrafts, type KpiGateBandDraft } from './kpi-gate-band-utils';
import { KpiPolicyCapField, parseCapMultiplierDraft } from './kpi-policy-cap-field';
import { KPI_POLICY_CAP_MULTIPLIER_DEFAULT } from './kpi-policy-cap.constants';
import { KpiPolicyScorecardMetrics } from './kpi-policy-scorecard-metrics';

const STATUS_VARIANT: Record<string, 'green' | 'amber' | 'gray' | 'red'> = {
  ACTIVE: 'green',
  DRAFT: 'amber',
  ARCHIVED: 'gray',
};

export function KpiPolicyEditorCard({
  policy,
  saving,
  onSave,
}: {
  policy: KpiPolicyRow;
  saving: boolean;
  onSave: (
    id: string,
    payload: {
      name: string;
      gateRules: KpiPolicyRow['gateRules'];
      bonusCapBaseSalaryMultiplier: number;
      status: KpiPolicyRow['status'];
    },
  ) => Promise<void>;
}) {
  const [name, setName] = useState(policy.name);
  const [bands, setBands] = useState<KpiGateBandDraft[]>(() => rulesToDrafts(policy.gateRules));
  const [capMultiplier, setCapMultiplier] = useState(
    () => policy.bonusCapBaseSalaryMultiplier || String(KPI_POLICY_CAP_MULTIPLIER_DEFAULT),
  );
  const [status, setStatus] = useState(policy.status);

  const handleSave = async () => {
    const gateRules = parseDraftsToRules(bands);
    const cap = parseCapMultiplierDraft(capMultiplier);
    if (gateRules == null || cap == null) {
      return;
    }
    await onSave(policy.id, {
      name: name.trim(),
      gateRules,
      bonusCapBaseSalaryMultiplier: cap,
      status,
    });
  };

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge label={policy.status} variant={STATUS_VARIANT[policy.status] ?? 'gray'} />
        <span className="text-muted-foreground font-mono text-xs">{policy.templateCode}</span>
        {policy.linkedProfileCount > 0 ? (
          <span className="text-muted-foreground text-xs">
            {policy.linkedProfileCount} compensation profile
            {policy.linkedProfileCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Policy name</span>
          <Input value={name} disabled={saving} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            disabled={saving}
            onChange={(e) => setStatus(e.target.value as KpiPolicyRow['status'])}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>
      <div className="mb-4 max-w-xs">
        <KpiPolicyCapField value={capMultiplier} disabled={saving} onChange={setCapMultiplier} />
      </div>
      <KpiGateBandEditor bands={bands} onChange={setBands} disabled={saving} />
      <KpiPolicyScorecardMetrics metrics={policy.scorecardMetrics} />
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={saving || name.trim().length < 2}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving…' : 'Save policy'}
        </Button>
      </div>
    </div>
  );
}
