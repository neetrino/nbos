import {
  BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
  BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
  BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
  BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
  BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
} from '@/features/my-company/compensation/bonus-policy-template-codes';

export type BonusPolicyTemplateOption = {
  value: string;
  label: string;
  hint: string;
};

export const BONUS_POLICY_TEMPLATE_OPTIONS: BonusPolicyTemplateOption[] = [
  {
    value: BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
    label: 'Sales — company rate grid',
    hint: 'Accrual from paid invoices; rates in Sales bonus policies.',
  },
  {
    value: BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
    label: 'Manual only',
    hint: 'No automatic accrual; bonuses created in Finance.',
  },
  {
    value: BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
    label: 'Delivery — proportional pool',
    hint: 'AUTO release when product is Done and client payments fund the pool.',
  },
  {
    value: BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
    label: 'Marketing — manual planned',
    hint: 'Manual MARKETING entries until scorecard accrual ships.',
  },
  {
    value: BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
    label: 'Support — manual planned',
    hint: 'Manual support bonuses until SLA scorecard accrual ships.',
  },
];

export function bonusPolicyTemplateLabel(code: string): string {
  return BONUS_POLICY_TEMPLATE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}
