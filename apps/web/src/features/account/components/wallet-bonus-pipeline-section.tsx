'use client';

import { Wallet } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  WALLET_BONUS_PIPELINE_LABEL,
  WALLET_BONUS_PIPELINE_ORDER,
} from '@/features/finance/constants/employee-wallet-ui';
import { WALLET_PIPELINE_GROUP_EXPLANATION } from '@/features/finance/constants/employee-wallet-explanations';
import { walletBonusEntryExplanation } from '@/features/finance/utils/wallet-bonus-entry-explanation';
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
  const groups = new Map<WalletBonusPipelineGroup, EmployeeWalletBonusRow[]>();
  for (const g of WALLET_BONUS_PIPELINE_ORDER) {
    groups.set(g, []);
  }
  for (const row of bonuses) {
    groups.get(row.walletGroup)?.push(row);
  }

  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Bonus pipeline</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WALLET_BONUS_PIPELINE_ORDER.map((group) => {
          const rows = groups.get(group) ?? [];
          return (
            <div key={group} className="border-border bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-muted-foreground" aria-hidden />
                <h3 className="text-foreground text-xs font-semibold">
                  {WALLET_BONUS_PIPELINE_LABEL[group]}
                </h3>
                <span className="bg-secondary text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                  {rows.length}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
                {WALLET_PIPELINE_GROUP_EXPLANATION[group]}
              </p>
              <ul className="mt-3 space-y-2">
                {rows.length === 0 ? (
                  <li className="text-muted-foreground text-xs">No entries</li>
                ) : (
                  rows.map((b) => {
                    const hint = walletBonusEntryExplanation(b);
                    return (
                      <li key={b.id} className="border-border rounded-lg border p-2.5 text-xs">
                        <div className="text-foreground leading-snug font-semibold">
                          {b.productLabel}
                        </div>
                        <div className="text-muted-foreground mt-1 text-[11px]">
                          {b.project.code} · {b.order.code}
                        </div>
                        <div className="text-muted-foreground mt-0.5">{b.type}</div>
                        <div className="text-foreground mt-1 font-semibold">
                          Planned {formatAmount(parseAmount(b.amount))}
                        </div>
                        <div className="text-muted-foreground mt-1 leading-snug tabular-nums">
                          Released {formatAmount(parseAmount(b.releasedAmount))} · Paid{' '}
                          {formatAmount(parseAmount(b.paidAmount))} · Remaining{' '}
                          {formatAmount(parseAmount(b.remainingAmount))}
                        </div>
                        {b.kpiBurnedAmount ? (
                          <div className="text-destructive mt-1 text-[10px] tabular-nums">
                            Burned KPI {formatAmount(parseAmount(b.kpiBurnedAmount))}
                          </div>
                        ) : null}
                        {hint ? (
                          <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
                            {hint}
                          </p>
                        ) : null}
                        {b.payrollMonth ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            Payroll (release): {b.payrollMonth}
                          </div>
                        ) : null}
                        {b.salesAccrualHint ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            {b.salesAccrualHint}
                          </div>
                        ) : null}
                        {b.orderPaymentType === 'SUBSCRIPTION' ? (
                          <div className="text-muted-foreground mt-1 text-[10px] leading-snug">
                            Subscription order — bonus releases may follow client invoice payments.
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
