'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY } from '@nbos/shared';
import {
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetSection,
  MoneyInput,
} from '@/components/shared';
import { formatGroupedNumber, parseMoneyAmount } from '@/lib/format/money';
import { liveNormDisplayStatus } from './live-norm-pair';
import type { LiveSalePrice } from './live-sale-prices';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { plainSaleAmount } from './sale-price-save';

export function SalePriceSheetEditor({
  pair,
  hint,
  extra,
  canPublish,
  amount,
  onAmountChange,
}: {
  pair: LiveSalePrice | null;
  hint: string;
  extra?: ReactNode;
  canPublish: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const published = pair?.published?.amountPerUnit ?? null;
  const status = pair && (pair.published || pair.draft) ? liveNormDisplayStatus(pair) : null;

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      {extra}
      <DetailSheetSection title={t('salePrices.amountPerUnitShort')}>
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">{hint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyReadout label={t('rates.current')} amount={published} empty={t('none')} />
            <label className="space-y-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {t('salePrices.pending')}
              </span>
              <MoneyInput
                value={amount}
                disabled={!canPublish}
                onChange={onAmountChange}
                aria-label={t('salePrices.pending')}
              />
            </label>
          </div>
          {status ? (
            <NormativeStatusBadge status={status} label={t(normativeStatusLabelKey(status))} />
          ) : null}
        </div>
      </DetailSheetSection>
    </div>
  );
}

export function useSalePriceAmount(pair: LiveSalePrice | null): {
  amount: string;
  setAmount: (value: string) => void;
  dirty: boolean;
  reset: () => void;
} {
  const baseline = plainSaleAmount(pair?.draft?.amountPerUnit ?? pair?.published?.amountPerUnit);
  const [amount, setAmount] = useState(baseline);
  const [seen, setSeen] = useState(pair?.targetKey ?? null);
  if ((pair?.targetKey ?? null) !== seen) {
    setSeen(pair?.targetKey ?? null);
    setAmount(baseline);
  }
  useEffect(() => {
    setAmount(baseline);
  }, [baseline]);
  return {
    amount,
    setAmount,
    dirty: amount.trim() !== baseline,
    reset: () => setAmount(baseline),
  };
}

function MoneyReadout({
  label,
  amount,
  empty,
}: {
  label: string;
  amount: string | null;
  empty: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-foreground text-sm font-medium">
        {amount
          ? `${formatGroupedNumber(parseMoneyAmount(amount))} ${DELIVERY_COMPENSATION_CURRENCY}`
          : empty}
      </p>
    </div>
  );
}
