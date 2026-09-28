'use client';

import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { ExpenseBonusAssignmentPlan } from '@/features/finance/components/expenses/expense-payment-bonus-assignment';

export type ExpensePaymentBonusRow = {
  bonusReleaseId: string;
  title: string | null;
  orderCode: string | null;
  remaining: string;
};

export function ExpensePaymentBonusFields(props: {
  bonuses: ExpensePaymentBonusRow[];
  drafts: Record<string, string>;
  plan: ExpenseBonusAssignmentPlan;
  carryDraft: string;
  disabled: boolean;
  onDraftChange: (bonusReleaseId: string, amountText: string) => void;
  onCarryDraftChange: (amountText: string) => void;
}) {
  const t = useTranslations('expenses');
  if (props.plan.leftover === '0.00') return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {t('payments.salaryPart', { amount: formatAmount(Number(props.plan.salaryPart)) })}
      </p>
      <p className="text-sm">{t('payments.bonusAssignHint')}</p>
      {props.bonuses.map((bonus) => (
        <BonusAmountField
          key={bonus.bonusReleaseId}
          bonus={bonus}
          value={props.drafts[bonus.bonusReleaseId] ?? ''}
          disabled={props.disabled}
          onDraftChange={props.onDraftChange}
        />
      ))}
      <InlineField
        variant="controlled"
        label={t('payments.carryField')}
        type="money"
        value={props.carryDraft}
        disabled={props.disabled}
        placeholder="0.00"
        onValueChange={props.onCarryDraftChange}
      />
      {props.plan.carryPart !== '0.00' ? (
        <p className="text-muted-foreground text-sm">
          {t('payments.carryPart', { amount: formatAmount(Number(props.plan.carryPart)) })}
        </p>
      ) : null}
      {props.plan.unassigned !== '0.00' ? (
        <p className="text-destructive text-sm" role="status">
          {t('payments.assignShort', { amount: formatAmount(Number(props.plan.unassigned)) })}
        </p>
      ) : null}
    </div>
  );
}

function BonusAmountField(props: {
  bonus: ExpensePaymentBonusRow;
  value: string;
  disabled: boolean;
  onDraftChange: (bonusReleaseId: string, amountText: string) => void;
}) {
  const t = useTranslations('expenses');
  const label = props.bonus.title?.trim() || t('payments.bonusUntitled');
  const name = props.bonus.orderCode ? `${label} · ${props.bonus.orderCode}` : label;
  return (
    <InlineField
      variant="controlled"
      label={t('payments.bonusField', {
        name,
        amount: formatAmount(Number(props.bonus.remaining)),
      })}
      type="money"
      value={props.value}
      disabled={props.disabled}
      placeholder="0.00"
      onValueChange={(amountText) => props.onDraftChange(props.bonus.bonusReleaseId, amountText)}
    />
  );
}
