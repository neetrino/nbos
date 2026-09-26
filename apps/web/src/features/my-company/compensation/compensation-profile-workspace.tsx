'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DetailSheetFormFooter, DetailSheetTabBar } from '@/components/shared';
import { CompensationProfileFields } from '@/features/my-company/compensation/compensation-profile-fields';
import { SalaryHistoryList } from '@/features/my-company/compensation/salary-history-list';
import {
  bonusNote,
  isSalaryFormDirty,
  kpiNote,
  replaceActivated,
  salaryNote,
  salarySheetTabs,
  SalaryActivateConfirm,
  type SalaryFormSnapshot,
} from '@/features/my-company/compensation/salary-sheet-parts';
import { TEAM_SHEET_BODY_CLASS } from '@/features/hr/constants/team-sheet-layout';
import {
  compensationProfilesApi,
  type CompensationProfileRow,
} from '@/lib/api/compensation-profiles';
import { bonusPoliciesApi, type BonusPolicyRow } from '@/lib/api/bonus-policies';
import { kpiPoliciesApi, type KpiPolicyRow } from '@/lib/api/kpi-policies';
import type { Employee } from '@/lib/api/employees';
import { parseMoneyAmount } from '@/lib/format/money';
import { DEFAULT_KPI_POLICY_ID } from '@/lib/constants/default-kpi-policy-id';
import { BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES } from '@/features/my-company/compensation/bonus-policy-template-codes';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
  const t = useTranslations('hr.salaries');
  const [tab, setTab] = useState('general');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedId = initialEmployeeId;
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

  const loadProfiles = useCallback(
    async (employeeId: string) => {
      setLoading(true);
      try {
        const resp = await compensationProfilesApi.listForEmployee(employeeId);
        setProfiles(resp.items);
        setError(null);
      } catch {
        setError(t('loadFailed'));
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void Promise.all([bonusPoliciesApi.list(), kpiPoliciesApi.list()]).then(([bonus, kpi]) => {
      setBonusPolicies(bonus.items);
      setKpiPolicies(kpi.items);
    });
  }, []);

  useEffect(() => {
    setTab('general');
    setConfirmOpen(false);
    setError(null);
  }, [selectedId]);

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
    setEffectiveFrom(source.effectiveFrom.slice(0, 10));
  }, [draftProfile, activeProfile]);

  const requestSave = () => {
    const salary = parseMoneyAmount(baseSalary);
    if (!selectedId || baseSalary.trim() === '' || salary < 0) {
      setError(t('invalidSalary'));
      return;
    }
    setError(null);
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!selectedId) return;
    const salary = parseMoneyAmount(baseSalary);
    setBusy(true);
    try {
      const saved = await persistDraft(selectedId, salary);
      const updated = await compensationProfilesApi.activate(saved.id);
      setProfiles((prev) => replaceActivated(prev, updated));
      onSalaryActivated?.(updated.employeeId, updated.baseSalary);
      setConfirmOpen(false);
      setError(null);
    } catch {
      setError(t('saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const persistDraft = async (employeeId: string, salary: number) => {
    const payload = {
      baseSalary: salary,
      effectiveFrom,
      bonusPolicyId: bonusPolicyId || null,
      kpiPolicyId: kpiPolicyId || null,
    };
    if (draftProfile) {
      return compensationProfilesApi.patchDraft(draftProfile.id, payload);
    }
    return compensationProfilesApi.createDraft(employeeId, {
      baseSalary: salary,
      effectiveFrom,
      bonusPolicyId: bonusPolicyId || undefined,
      kpiPolicyId: kpiPolicyId || undefined,
    });
  };

  const handleBonusPolicy = (nextId: string) => {
    setBonusPolicyId(nextId);
    const template = activeBonusPolicies.find((p) => p.id === nextId)?.templateCode;
    if (template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES && !kpiPolicyId) {
      const hasDefault = activeKpiPolicies.some((p) => p.id === DEFAULT_KPI_POLICY_ID);
      if (hasDefault) setKpiPolicyId(DEFAULT_KPI_POLICY_ID);
    }
  };

  const activeSalaryNote = salaryNote(activeProfile, baseSalary, (amount) =>
    t('activeSalary', { amount }),
  );
  const activeKpiNote = kpiNote(activeProfile, kpiPolicyId, t('kpiOff'), (name) =>
    t('activeKpi', { name }),
  );
  const activeBonusNote = bonusNote(activeProfile, bonusPolicyId, t('bonusOff'), (name) =>
    t('activeBonus', { name }),
  );
  const savedSnapshot = savedSalarySnapshot(
    draftProfile ?? activeProfile,
    employees.find((row) => row.id === selectedId)?.baseSalary ?? '',
  );
  const dirty = isSalaryFormDirty(
    { baseSalary, effectiveFrom, bonusPolicyId, kpiPolicyId },
    savedSnapshot,
  );
  const resetForm = () => {
    setBaseSalary(savedSnapshot.baseSalary);
    setEffectiveFrom(savedSnapshot.effectiveFrom);
    setBonusPolicyId(savedSnapshot.bonusPolicyId);
    setKpiPolicyId(savedSnapshot.kpiPolicyId);
    setError(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={TEAM_SHEET_BODY_CLASS}>
          {error && !dirty ? <p className="text-destructive text-sm">{error}</p> : null}
          {selectedId ? (
            <>
              <DetailSheetTabBar
                tabs={salarySheetTabs(t('tabGeneral'), t('tabHistory'))}
                activeTab={tab}
                onTabChange={setTab}
              />
              {tab === 'history' ? (
                <SalaryHistoryList profiles={profiles} />
              ) : (
                <CompensationProfileFields
                  busy={busy || loading}
                  bonusPolicyId={bonusPolicyId}
                  kpiPolicyId={kpiPolicyId}
                  bonusPolicies={activeBonusPolicies}
                  kpiPolicies={activeKpiPolicies}
                  baseSalary={baseSalary}
                  effectiveFrom={effectiveFrom}
                  activeSalaryNote={activeSalaryNote}
                  activeKpiNote={activeKpiNote}
                  activeBonusNote={activeBonusNote}
                  onBonusPolicy={handleBonusPolicy}
                  onKpiPolicy={setKpiPolicyId}
                  onBaseSalary={setBaseSalary}
                  onEffectiveFrom={setEffectiveFrom}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
      <DetailSheetFormFooter
        visible={tab === 'general' && selectedId !== ''}
        dirty={dirty}
        saving={busy}
        errorMessage={dirty ? error : null}
        onSave={requestSave}
        onCancel={resetForm}
      />
      <SalaryActivateConfirm
        open={confirmOpen}
        busy={busy}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void confirmSave()}
      />
    </div>
  );
}

function savedSalarySnapshot(
  source: CompensationProfileRow | null,
  employeeSalary: string,
): SalaryFormSnapshot {
  if (!source) {
    return {
      baseSalary: employeeSalary,
      effectiveFrom: todayIsoDate(),
      bonusPolicyId: '',
      kpiPolicyId: '',
    };
  }
  return {
    baseSalary: source.baseSalary,
    effectiveFrom: source.effectiveFrom.slice(0, 10),
    bonusPolicyId: source.bonusPolicyId ?? '',
    kpiPolicyId: source.kpiPolicyId ?? '',
  };
}
