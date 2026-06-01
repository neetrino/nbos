'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { StatusBadge } from '@/components/shared';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import {
  compensationProfilesApi,
  type CompensationProfileRow,
} from '@/lib/api/compensation-profiles';
import { bonusPoliciesApi, type BonusPolicyRow } from '@/lib/api/bonus-policies';
import { kpiPoliciesApi, type KpiPolicyRow } from '@/lib/api/kpi-policies';
import type { Employee } from '@/lib/api/employees';
import { DEFAULT_BONUS_POLICY_ID } from '@/lib/constants/default-bonus-policy-id';
import { DEFAULT_KPI_POLICY_ID } from '@/lib/constants/default-kpi-policy-id';
import {
  BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
  BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
  BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
  BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
  BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
} from '@/features/my-company/compensation/bonus-policy-template-codes';

const STATUS_VARIANT: Record<string, StatusVariant> = {
  ACTIVE: 'green',
  DRAFT: 'amber',
  REVIEW: 'blue',
  ARCHIVED: 'gray',
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function employeeLabel(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function CompensationProfileWorkspace({ employees }: { employees: readonly Employee[] }) {
  const [selectedId, setSelectedId] = useState('');
  const [profiles, setProfiles] = useState<CompensationProfileRow[]>([]);
  const [bonusPolicies, setBonusPolicies] = useState<BonusPolicyRow[]>([]);
  const [kpiPolicies, setKpiPolicies] = useState<KpiPolicyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [baseSalary, setBaseSalary] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate());
  const [bonusPolicyId, setBonusPolicyId] = useState(DEFAULT_BONUS_POLICY_ID);
  const [kpiPolicyId, setKpiPolicyId] = useState(DEFAULT_KPI_POLICY_ID);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedId),
    [employees, selectedId],
  );

  const activeBonusPolicies = useMemo(
    () => bonusPolicies.filter((p) => p.status === 'ACTIVE'),
    [bonusPolicies],
  );

  const activeKpiPolicies = useMemo(
    () => kpiPolicies.filter((p) => p.status === 'ACTIVE'),
    [kpiPolicies],
  );

  const draftProfile = useMemo(
    () => profiles.find((p) => p.status === 'DRAFT') ?? null,
    [profiles],
  );

  const selectedBonusTemplate = useMemo(
    () => activeBonusPolicies.find((p) => p.id === bonusPolicyId)?.templateCode ?? null,
    [activeBonusPolicies, bonusPolicyId],
  );

  const selectedKpiPolicy = useMemo(
    () => activeKpiPolicies.find((p) => p.id === kpiPolicyId) ?? null,
    [activeKpiPolicies, kpiPolicyId],
  );

  const loadProfiles = useCallback(async (employeeId: string) => {
    setLoading(true);
    try {
      const resp = await compensationProfilesApi.listForEmployee(employeeId);
      setProfiles(resp.items);
      setError(null);
    } catch {
      setError('Could not load compensation profiles for this employee.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([bonusPoliciesApi.list(), kpiPoliciesApi.list()]).then(([bonus, kpi]) => {
      setBonusPolicies(bonus.items);
      setKpiPolicies(kpi.items);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setProfiles([]);
      return;
    }
    const emp = employees.find((e) => e.id === selectedId);
    setBaseSalary(emp?.baseSalary ?? '');
    setEffectiveFrom(todayIsoDate());
    void loadProfiles(selectedId);
  }, [selectedId, employees, loadProfiles]);

  useEffect(() => {
    if (draftProfile?.bonusPolicyId) {
      setBonusPolicyId(draftProfile.bonusPolicyId);
    }
  }, [draftProfile?.id, draftProfile?.bonusPolicyId]);

  useEffect(() => {
    if (draftProfile?.kpiPolicyId) {
      setKpiPolicyId(draftProfile.kpiPolicyId);
    }
  }, [draftProfile?.id, draftProfile?.kpiPolicyId]);

  const handleCreateDraft = async () => {
    if (!selectedId) return;
    const salary = Number.parseFloat(baseSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      setError('Enter a valid base salary.');
      return;
    }
    setBusy(true);
    try {
      const created = await compensationProfilesApi.createDraft(selectedId, {
        baseSalary: salary,
        effectiveFrom,
        bonusPolicyId: bonusPolicyId || undefined,
        kpiPolicyId: kpiPolicyId || undefined,
      });
      setProfiles((prev) => [created, ...prev]);
      setError(null);
    } catch {
      setError('Could not create draft profile.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraftPolicies = async () => {
    if (!draftProfile) return;
    setBusy(true);
    try {
      const updated = await compensationProfilesApi.patchDraft(draftProfile.id, {
        bonusPolicyId: bonusPolicyId || null,
        kpiPolicyId: kpiPolicyId || null,
      });
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setError(null);
    } catch {
      setError('Could not update policies on draft.');
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async (profileId: string) => {
    setBusy(true);
    try {
      const updated = await compensationProfilesApi.activate(profileId);
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id === updated.id) return updated;
          if (p.status === 'ACTIVE' && p.id !== updated.id) {
            return { ...p, status: 'ARCHIVED' as const };
          }
          return p;
        }),
      );
      setError(null);
    } catch {
      setError('Could not activate profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-border bg-card space-y-4 rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Compensation profiles</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Link bonus and KPI policies per employee. Payroll attach uses the ACTIVE profile for the
            payroll month; sales accrual uses company rate rows when bonus policy is sales template.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/my-company/sales-bonus-policies"
            className="text-primary font-medium hover:underline"
          >
            Sales rates
          </Link>
          <Link
            href="/my-company/kpi-policies"
            className="text-primary font-medium hover:underline"
          >
            KPI gates
          </Link>
        </div>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Employee</span>
        <select
          className="border-input bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {employeeLabel(e)}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {selectedId ? (
        <>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading profiles…</p>
          ) : (
            <ul className="space-y-2">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className="border-border flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <StatusBadge label={p.status} variant={STATUS_VARIANT[p.status] ?? 'gray'} />
                  <span className="tabular-nums">
                    {p.baseSalary} {p.currency}
                  </span>
                  <span className="text-muted-foreground">from {p.effectiveFrom}</span>
                  <span className="text-muted-foreground">Bonus: {p.bonusPolicy?.name ?? '—'}</span>
                  <span className="text-muted-foreground">KPI: {p.kpiPolicy?.name ?? '—'}</span>
                  {p.status === 'DRAFT' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="ml-auto"
                      onClick={() => void handleActivate(p.id)}
                    >
                      Activate
                    </Button>
                  ) : null}
                </li>
              ))}
              {profiles.length === 0 ? (
                <li className="text-muted-foreground text-sm">No profiles yet.</li>
              ) : null}
            </ul>
          )}

          <div className="border-border grid gap-3 rounded-xl border p-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Bonus policy</span>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={bonusPolicyId}
                disabled={busy || activeBonusPolicies.length === 0}
                onChange={(e) => setBonusPolicyId(e.target.value)}
              >
                <option value="">None</option>
                {activeBonusPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedBonusTemplate === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES ? (
                <p className="text-muted-foreground text-xs">
                  Percentages are edited under{' '}
                  <Link
                    href="/my-company/sales-bonus-policies"
                    className="text-primary hover:underline"
                  >
                    Sales bonus policies
                  </Link>
                  .
                </p>
              ) : null}
              {selectedBonusTemplate === BONUS_POLICY_TEMPLATE_MANUAL_ONLY ? (
                <p className="text-muted-foreground text-xs">
                  No automatic accrual — bonuses are created manually in Finance.
                </p>
              ) : null}
              {selectedBonusTemplate === BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING ? (
                <p className="text-muted-foreground text-xs">
                  Planned delivery bonuses auto-release proportionally when the product is Done and
                  client payments fund the pool (Finance bonus pools).
                </p>
              ) : null}
              {selectedBonusTemplate === BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED ? (
                <p className="text-muted-foreground text-xs">
                  Create bonus entries on Finance → Bonus board (Create bonus). Automated MQL/SQL
                  accrual is not wired yet.
                </p>
              ) : null}
              {selectedBonusTemplate === BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED ? (
                <p className="text-muted-foreground text-xs">
                  Create bonus entries on Finance → Bonus board (Create bonus). Automated SLA
                  accrual is not wired yet.
                </p>
              ) : null}
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">KPI gate policy</span>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={kpiPolicyId}
                disabled={busy || activeKpiPolicies.length === 0}
                onChange={(e) => setKpiPolicyId(e.target.value)}
              >
                <option value="">None</option>
                {activeKpiPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedKpiPolicy != null && selectedKpiPolicy.scorecardMetrics.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  Scorecard:{' '}
                  {selectedKpiPolicy.scorecardMetrics
                    .map((m) =>
                      m.payrollField
                        ? `${m.label} → payroll ${m.payrollField === 'kpiSalesPlanAmount' ? 'plan' : 'actual'}`
                        : m.label,
                    )
                    .join(' · ')}
                </p>
              ) : null}
            </label>
            {draftProfile ? (
              <div className="flex items-end md:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleSaveDraftPolicies()}
                >
                  Save policies on draft
                </Button>
              </div>
            ) : null}
          </div>

          {!draftProfile && selectedEmployee ? (
            <div className="border-border grid gap-3 rounded-xl border p-3 md:grid-cols-3">
              <NbosMoneyInput
                label="Base salary"
                labelClassName="text-muted-foreground font-normal"
                value={baseSalary}
                disabled={busy}
                onChange={setBaseSalary}
              />
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Effective from</span>
                <Input
                  type="date"
                  value={effectiveFrom}
                  disabled={busy}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleCreateDraft()}
                >
                  Create draft profile
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
