'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function CompensationProfileWorkspace({
  employees,
  initialEmployeeId = '',
  onSalaryActivated,
  onEditorState,
  activateRef,
}: {
  employees: readonly Employee[];
  initialEmployeeId?: string;
  onSalaryActivated?: (employeeId: string, baseSalary: string) => void;
  onEditorState?: (state: { canActivate: boolean; busy: boolean }) => void;
  activateRef?: { current: () => void };
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

  const draftId = draftProfile?.id ?? null;
  const activateCurrent = useRef(handleActivate);
  activateCurrent.current = handleActivate;
  if (activateRef) {
    activateRef.current = () => {
      if (draftId) void activateCurrent.current(draftId);
    };
  }

  useEffect(() => {
    onEditorState?.({ canActivate: draftId != null && !busy, busy });
  }, [busy, draftId, onEditorState]);

  return (
    <div className="space-y-4">
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
                  className="border-border bg-card flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-sm"
                >
                  <StatusBadge label={p.status} variant={STATUS_VARIANT[p.status] ?? 'gray'} />
                  <span className="tabular-nums">
                    {p.baseSalary} {p.currency}
                  </span>
                  <span className="text-muted-foreground">from {p.effectiveFrom}</span>
                  <span className="text-muted-foreground">Bonus: {p.bonusPolicy?.name ?? '—'}</span>
                  <span className="text-muted-foreground">KPI: {p.kpiPolicy?.name ?? '—'}</span>
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
