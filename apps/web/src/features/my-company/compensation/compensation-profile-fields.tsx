import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
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
  hasDraft,
  onBonusPolicy,
  onKpiPolicy,
  onBaseSalary,
  onEffectiveFrom,
  onSaveDraft,
}: {
  busy: boolean;
  bonusPolicyId: string;
  kpiPolicyId: string;
  bonusPolicies: readonly BonusPolicyRow[];
  kpiPolicies: readonly KpiPolicyRow[];
  baseSalary: string;
  effectiveFrom: string;
  hasDraft: boolean;
  onBonusPolicy: (id: string) => void;
  onKpiPolicy: (id: string) => void;
  onBaseSalary: (value: string) => void;
  onEffectiveFrom: (value: string) => void;
  onSaveDraft: () => void;
}) {
  const template = bonusPolicies.find((p) => p.id === bonusPolicyId)?.templateCode ?? null;
  const kpi = kpiPolicies.find((p) => p.id === kpiPolicyId) ?? null;

  return (
    <>
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
        onBonusPolicy={onBonusPolicy}
        onKpiPolicy={onKpiPolicy}
      />
      <SalaryDraftFields
        busy={busy}
        baseSalary={baseSalary}
        effectiveFrom={effectiveFrom}
        hasDraft={hasDraft}
        onBaseSalary={onBaseSalary}
        onEffectiveFrom={onEffectiveFrom}
        onSaveDraft={onSaveDraft}
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
  onBonusPolicy: (id: string) => void;
  onKpiPolicy: (id: string) => void;
}) {
  return (
    <div className="border-border grid gap-3 rounded-xl border p-3 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Bonus rule</span>
        <Select
          value={bonusPolicyId || 'none'}
          disabled={busy || bonusPolicies.length === 0}
          onValueChange={(v) => onBonusPolicy(!v || v === 'none' ? '' : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {bonusPolicies.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <BonusRuleHint template={template} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">KPI gate</span>
        <Select
          value={kpiPolicyId || 'none'}
          disabled={busy || kpiPolicies.length === 0}
          onValueChange={(v) => onKpiPolicy(!v || v === 'none' ? '' : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {kpiPolicies.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kpiLabel ? <p className="text-muted-foreground text-xs">Scorecard: {kpiLabel}</p> : null}
        {template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES && !kpiPolicyId ? (
          <p className="text-muted-foreground text-xs">
            Sales bonuses are not scaled until you attach a KPI gate.
          </p>
        ) : null}
      </label>
    </div>
  );
}

function SalaryDraftFields({
  busy,
  baseSalary,
  effectiveFrom,
  hasDraft,
  onBaseSalary,
  onEffectiveFrom,
  onSaveDraft,
}: {
  busy: boolean;
  baseSalary: string;
  effectiveFrom: string;
  hasDraft: boolean;
  onBaseSalary: (value: string) => void;
  onEffectiveFrom: (value: string) => void;
  onSaveDraft: () => void;
}) {
  return (
    <div className="border-border grid gap-3 rounded-xl border p-3 md:grid-cols-3">
      <NbosMoneyInput
        label="Minimum salary"
        labelClassName="text-muted-foreground font-normal"
        value={baseSalary}
        disabled={busy}
        onChange={onBaseSalary}
      />
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Effective from</span>
        <Input
          type="date"
          value={effectiveFrom}
          disabled={busy}
          onChange={(e) => onEffectiveFrom(e.target.value)}
        />
      </label>
      <div className="flex items-end">
        <Button type="button" size="sm" disabled={busy} onClick={onSaveDraft}>
          {hasDraft ? 'Save draft' : 'Create draft'}
        </Button>
      </div>
    </div>
  );
}

function BonusRuleHint({ template }: { template: string | null }) {
  if (template === BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES) {
    return (
      <p className="text-muted-foreground text-xs">
        Percentages are edited under{' '}
        <Link href="/my-company/sales-bonus-policies" className="text-primary hover:underline">
          Sales bonus policies
        </Link>
        .
      </p>
    );
  }
  if (template === BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING) {
    return (
      <p className="text-muted-foreground text-xs">
        Delivery bonuses release when the product is Done and payments fund the pool. Leave KPI
        empty for developers.
      </p>
    );
  }
  if (template === BONUS_POLICY_TEMPLATE_MANUAL_ONLY) {
    return (
      <p className="text-muted-foreground text-xs">
        No automatic accrual — bonuses are created manually in Finance.
      </p>
    );
  }
  if (
    template === BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED ||
    template === BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED
  ) {
    return (
      <p className="text-muted-foreground text-xs">
        Create bonus entries on Finance → Bonus board. Automated accrual is not wired yet.
      </p>
    );
  }
  return null;
}
