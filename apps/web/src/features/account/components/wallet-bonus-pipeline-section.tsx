'use client';

'use client';

import { Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatAmount } from '@/features/finance/constants/finance';
import { WALLET_BONUS_PIPELINE_ORDER } from '@/features/finance/constants/employee-wallet-ui';
import {
  WALLET_PIPELINE_EXPLAIN_KEYS,
  WALLET_PIPELINE_LABEL_KEYS,
} from '@/features/account/constants/wallet-ui';
import { formatWalletBonusHint } from '@/features/account/utils/format-wallet-bonus-hint';
import { BonusPolicyBreakdownBadges } from '@/features/finance/components/payroll/bonus-policy-breakdown-badges';
import { resolveWalletBonusEntryExplanation } from '@/features/finance/utils/wallet-bonus-entry-explanation';
import type { EmployeeWalletBonusRow, WalletBonusPipelineGroup } from '@/lib/api/me';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function WalletBonusPipelineSection({
  bonuses,
}: {
  bonuses: readonly EmployeeWalletBonusRow[];
}) {
  const t = useTranslations('account.wallet');
  const tPipeline = useTranslations('account.wallet.pipeline');
  const tBonus = useTranslations('account.wallet.bonus');
  const groups = new Map<WalletBonusPipelineGroup, EmployeeWalletBonusRow[]>();
  for (const g of WALLET_BONUS_PIPELINE_ORDER) {
    groups.set(g, []);
  }
  for (const row of bonuses) {
    groups.get(row.walletGroup)?.push(row);
  }

  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">{t('bonus.title')}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WALLET_BONUS_PIPELINE_ORDER.map((group) => {
          const rows = groups.get(group) ?? [];
          return (
            <div key={group} className="border-border bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-muted-foreground" aria-hidden />
                <h3 className="text-foreground text-xs font-semibold">
                  {tPipeline(WALLET_PIPELINE_LABEL_KEYS[group])}
                </h3>
                <span className="bg-secondary text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                  {rows.length}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
                {tPipeline(WALLET_PIPELINE_EXPLAIN_KEYS[group])}
              </p>
              <ul className="mt-3 space-y-2">
                {rows.length === 0 ? (
                  <li className="text-muted-foreground text-xs">{t('pipeline.noEntries')}</li>
                ) : (
                  rows.map((b) => {
                    const hint = formatWalletBonusHint(
                      resolveWalletBonusEntryExplanation(b),
                      (key, values) => tBonus(key, values),
                    );
                    return (
                      <li key={b.id} className="border-border rounded-lg border p-2.5 text-xs">
                        <div className="text-foreground leading-snug font-semibold">
                          {b.productLabel}
                        </div>
                        <div className="text-muted-foreground mt-1 text-[11px]">
                          {b.project.name} · {b.order.code}
                        </div>
                        <div className="text-muted-foreground mt-0.5">{b.type}</div>
                        {b.policyBreakdownStatuses.length > 0 ? (
                          <div className="mt-2">
                            <BonusPolicyBreakdownBadges statuses={b.policyBreakdownStatuses} />
                          </div>
                        ) : null}
                        <div className="text-foreground mt-1 font-semibold">
                          {t('bonus.planned', { amount: formatAmount(parseAmount(b.amount)) })}
                        </div>
                        <div className="text-muted-foreground mt-1 leading-snug tabular-nums">
                          {t('bonus.releasedPaidRemaining', {
                            released: formatAmount(parseAmount(b.releasedAmount)),
                            paid: formatAmount(parseAmount(b.paidAmount)),
                            remaining: formatAmount(parseAmount(b.remainingAmount)),
                          })}
                        </div>
                        {b.kpiBurnedAmount ? (
                          <div className="text-destructive mt-1 text-[10px] tabular-nums">
                            {t('bonus.burnedKpi', {
                              amount: formatAmount(parseAmount(b.kpiBurnedAmount)),
                            })}
                          </div>
                        ) : null}
                        {b.payrollCarryOverAmount ? (
                          <div className="text-muted-foreground mt-1 text-[10px] tabular-nums">
                            {t('bonus.carryOver', {
                              amount: formatAmount(parseAmount(b.payrollCarryOverAmount)),
                            })}
                          </div>
                        ) : null}
                        {hint ? (
                          <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
                            {hint}
                          </p>
                        ) : null}
                        {b.payrollMonth ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            {t('bonus.payrollRelease', { month: b.payrollMonth })}
                          </div>
                        ) : null}
                        {b.salesAccrualHint ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            {b.salesAccrualHint}
                          </div>
                        ) : null}
                        {b.orderPaymentType === 'SUBSCRIPTION' ? (
                          <div className="text-muted-foreground mt-1 text-[10px] leading-snug">
                            {t('bonus.subscription')}
                          </div>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
