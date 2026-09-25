'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared';
import { CompensationProfileFields } from '@/features/my-company/compensation/compensation-profile-fields';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import {
  compensationProfilesApi,
  type CompensationProfileRow,
} from '@/lib/api/compensation-profiles';
import { bonusPoliciesApi, type BonusPolicyRow } from '@/lib/api/bonus-policies';
import { kpiPoliciesApi, type KpiPolicyRow } from '@/lib/api/kpi-policies';
import type { Employee } from '@/lib/api/employees';
import { DEFAULT_KPI_POLICY_ID } from '@/lib/constants/default-kpi-policy-id';
import { BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES } from '@/features/my-company/compensation/bonus-policy-template-codes';

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

export function CompensationProfileWorkspace({
  employees,
  initialEmployeeId = '',
  onSalaryActivated,
}: {
  employees: readonly Employee[];
  initialEmployeeId?: string;
  onSalaryActivated?: (employeeId: string, baseSalary: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(initialEmployeeId);
  const [profiles, setProfiles] = useState<CompensationProfileRow[]>([]);
  const [bonusPolicies, setBonusPolicies] = useState<BonusPolicyRow[]>([]);
  const [kpiPolicies, setKpiPolicies] = useState<KpiPolicyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [baseSalary, setBaseSalary] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate());
  const [bonusPolicyId, setBonusPolicyId] = useState('');
  const [kpiPolicyId, setKpiPolicyId] = useState('');

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

  const activeProfile = useMemo(
    () => profiles.find((p) => p.status === 'ACTIVE') ?? null,
    [profiles],
  );

  useEffect(() => {
    const source = draftProfile ?? activeProfile;
    if (!source) return;
    setBaseSalary(source.baseSalary);
    setBonusPolicyId(source.bonusPolicyId ?? '');
    setKpiPolicyId(source.kpiPolicyId ?? '');
  }, [draftProfile, activeProfile]);

  const handleSaveDraft = async () => {
    if (!selectedId) return;
    const salary = Number.parseFloat(baseSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      setError('Enter a valid minimum salary.');
      return;
    }
    setBusy(true);
    try {
      if (draftProfile) {
        const updated = await compensationProfilesApi.patchDraft(draftProfile.id, {
          baseSalary: salary,
          effectiveFrom,
          bonusPolicyId: bonusPolicyId || null,
          kpiPolicyId: kpiPolicyId || null,
        });
        setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await compensationProfilesApi.createDraft(selectedId, {
          baseSalary: salary,
          effectiveFrom,
          bonusPolicyId: bonusPolicyId || undefined,
          kpiPolicyId: kpiPolicyId || undefined,
        });
        setProfiles((prev) => [created, ...prev]);
      }
      setError(null);
    } catch {
      setError('Could not save the salary draft.');
    } finally {
      setBusy(false);
    }
  };

  const handleBonusPolicy = (nextId: string) => {
    setBonusPolicyId(nextId);
    const template = activeBonusPolicies.find((p) => p.id === nextId)?.templateCode;
    if (template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES && !kpiPolicyId) {
      const hasDefault = activeKpiPolicies.some((p) => p.id === DEFAULT_KPI_POLICY_ID);
      if (hasDefault) setKpiPolicyId(DEFAULT_KPI_POLICY_ID);
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
      onSalaryActivated?.(updated.employeeId, updated.baseSalary);
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
          <h2 className="text-foreground text-sm font-semibold">Minimum salary</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Everyone gets a minimum salary plus bonuses. Sales: attach the sales bonus rule and a
            KPI gate. Developers: salary plus the delivery bonus rule, and leave KPI empty.
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

      <label className="block max-w-md space-y-1 text-sm">
        <span className="text-muted-foreground">Employee</span>
        <Select
          value={selectedId || 'none'}
          onValueChange={(v) => setSelectedId(!v || v === 'none' ? '' : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select employee…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select employee…</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {employeeLabel(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

          <CompensationProfileFields
            busy={busy}
            bonusPolicyId={bonusPolicyId}
            kpiPolicyId={kpiPolicyId}
            bonusPolicies={activeBonusPolicies}
            kpiPolicies={activeKpiPolicies}
            baseSalary={baseSalary}
            effectiveFrom={effectiveFrom}
            hasDraft={draftProfile != null}
            onBonusPolicy={handleBonusPolicy}
            onKpiPolicy={setKpiPolicyId}
            onBaseSalary={setBaseSalary}
            onEffectiveFrom={setEffectiveFrom}
            onSaveDraft={() => void handleSaveDraft()}
          />
        </>
      ) : null}
    </div>
  );
}
