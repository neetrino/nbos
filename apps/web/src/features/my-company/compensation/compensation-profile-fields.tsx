'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Calendar, CircleDollarSign, Percent } from 'lucide-react';
import { DetailSheetSection, InlineField } from '@/components/shared';
import {
  TEAM_SHEET_FIELD_GRID_CLASS,
  TEAM_SHEET_SECTION_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import type { BonusPolicyRow } from '@/lib/api/bonus-policies';
import type { KpiPolicyRow } from '@/lib/api/kpi-policies';
import {
  BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
  BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
  BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
  BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
  BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
} from '@/features/my-company/compensation/bonus-policy-template-codes';

export function CompensationProfileFields({
  busy,
  bonusPolicyId,
  kpiPolicyId,
  bonusPolicies,
  kpiPolicies,
  baseSalary,
  effectiveFrom,
  activeSalaryNote,
  activeKpiNote,
  activeBonusNote,
  onBonusPolicy,
  onKpiPolicy,
  onBaseSalary,
  onEffectiveFrom,
}: {
  busy: boolean;
  bonusPolicyId: string;
  kpiPolicyId: string;
  bonusPolicies: readonly BonusPolicyRow[];
  kpiPolicies: readonly KpiPolicyRow[];
  baseSalary: string;
  effectiveFrom: string;
  activeSalaryNote: string | null;
  activeKpiNote: string | null;
  activeBonusNote: string | null;
  onBonusPolicy: (id: string) => void;
  onKpiPolicy: (id: string) => void;
  onBaseSalary: (value: string) => void;
  onEffectiveFrom: (value: string) => void;
}) {
  const template = bonusPolicies.find((p) => p.id === bonusPolicyId)?.templateCode ?? null;
  const kpi = kpiPolicies.find((p) => p.id === kpiPolicyId) ?? null;

  return (
    <>
      <SalaryDraftFields
        busy={busy}
        baseSalary={baseSalary}
        effectiveFrom={effectiveFrom}
        activeSalaryNote={activeSalaryNote}
        onBaseSalary={onBaseSalary}
        onEffectiveFrom={onEffectiveFrom}
      />
      <BonusAndKpiFields
        busy={busy}
        bonusPolicyId={bonusPolicyId}
        kpiPolicyId={kpiPolicyId}
        bonusPolicies={bonusPolicies}
        kpiPolicies={kpiPolicies}
        template={template}
        kpiLabel={
          kpi != null && kpi.scorecardMetrics.length > 0
            ? kpi.scorecardMetrics.map((m) => m.label).join(' · ')
            : null
        }
        activeKpiNote={activeKpiNote}
        activeBonusNote={activeBonusNote}
        onBonusPolicy={onBonusPolicy}
        onKpiPolicy={onKpiPolicy}
      />
    </>
  );
}

function BonusAndKpiFields({
  busy,
  bonusPolicyId,
  kpiPolicyId,
  bonusPolicies,
  kpiPolicies,
  template,
  kpiLabel,
  activeKpiNote,
  activeBonusNote,
  onBonusPolicy,
  onKpiPolicy,
}: {
  busy: boolean;
  bonusPolicyId: string;
  kpiPolicyId: string;
  bonusPolicies: readonly BonusPolicyRow[];
  kpiPolicies: readonly KpiPolicyRow[];
  template: string | null;
  kpiLabel: string | null;
  activeKpiNote: string | null;
  activeBonusNote: string | null;
  onBonusPolicy: (id: string) => void;
  onKpiPolicy: (id: string) => void;
}) {
  const t = useTranslations('hr.salaries');
  return (
    <DetailSheetSection
      title={t('sectionBonus')}
      icon={<Percent size={12} />}
      className={TEAM_SHEET_SECTION_CLASS}
    >
      <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
        <div className="space-y-1.5">
          <InlineField
            variant="controlled"
            label={t('bonusRule')}
            type="select"
            value={bonusPolicyId || 'none'}
            options={policyOptions(t('none'), bonusPolicies)}
            placeholder={t('none')}
            disabled={busy || bonusPolicies.length === 0}
            onValueChange={(value) => onBonusPolicy(value === 'none' ? '' : value)}
          />
          {activeBonusNote ? (
            <p className="text-muted-foreground text-xs">{activeBonusNote}</p>
          ) : null}
          <BonusRuleHint template={template} />
        </div>
        <div className="space-y-1.5">
          <InlineField
            variant="controlled"
            label={t('kpiGate')}
            type="select"
            value={kpiPolicyId || 'none'}
            options={policyOptions(t('none'), kpiPolicies)}
            placeholder={t('none')}
            disabled={busy || kpiPolicies.length === 0}
            onValueChange={(value) => onKpiPolicy(value === 'none' ? '' : value)}
          />
          {activeKpiNote ? <p className="text-muted-foreground text-xs">{activeKpiNote}</p> : null}
          {kpiLabel ? (
            <p className="text-muted-foreground text-xs">{t('scorecard', { metrics: kpiLabel })}</p>
          ) : null}
          {template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES && !kpiPolicyId ? (
            <p className="text-muted-foreground text-xs">{t('salesKpiHint')}</p>
          ) : null}
        </div>
      </div>
    </DetailSheetSection>
  );
}

function SalaryDraftFields({
  busy,
  baseSalary,
  effectiveFrom,
  activeSalaryNote,
  onBaseSalary,
  onEffectiveFrom,
}: {
  busy: boolean;
  baseSalary: string;
  effectiveFrom: string;
  activeSalaryNote: string | null;
  onBaseSalary: (value: string) => void;
  onEffectiveFrom: (value: string) => void;
}) {
  const t = useTranslations('hr.salaries');
  return (
    <DetailSheetSection
      title={t('sectionSalary')}
      icon={<CircleDollarSign size={12} />}
      className={TEAM_SHEET_SECTION_CLASS}
    >
      <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
        <InlineField
          variant="controlled"
          label={t('amount')}
          type="money"
          value={baseSalary}
          icon={<CircleDollarSign size={12} />}
          disabled={busy}
          onValueChange={onBaseSalary}
        />
        <InlineField
          variant="controlled"
          label={t('effectiveFrom')}
          type="date"
          value={effectiveFrom || null}
          icon={<Calendar size={12} />}
          disabled={busy}
          onValueChange={(value) => onEffectiveFrom(value ?? '')}
        />
      </div>
      {activeSalaryNote ? (
        <p className="text-muted-foreground mt-3 text-xs">{activeSalaryNote}</p>
      ) : null}
    </DetailSheetSection>
  );
}

function policyOptions(noneLabel: string, rows: readonly { id: string; name: string }[]) {
  return [
    { value: 'none', label: noneLabel },
    ...rows.map((row) => ({ value: row.id, label: row.name })),
  ];
}

function BonusRuleHint({ template }: { template: string | null }) {
  const t = useTranslations('hr.salaries');
  if (template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES) {
    return (
      <p className="text-muted-foreground text-xs">
        {t('salesHintBefore')}{' '}
        <Link href="/my-company/sales-bonus-policies" className="text-primary hover:underline">
          {t('salesHintLink')}
        </Link>
      </p>
    );
  }
  if (template === BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING) {
    return <p className="text-muted-foreground text-xs">{t('deliveryHint')}</p>;
  }
  if (template === BONUS_POLICY_TEMPLATE_MANUAL_ONLY) {
    return <p className="text-muted-foreground text-xs">{t('manualHint')}</p>;
  }
  if (
    template === BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED ||
    template === BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED
  ) {
    return <p className="text-muted-foreground text-xs">{t('plannedHint')}</p>;
  }
  return null;
}
