'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import { WALLET_PAYOUT_EXPLAIN_KEYS } from '@/features/account/constants/wallet-ui';
import type { EmployeeWalletProjectBreakdownRow } from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function WalletProjectBreakdownSection({
  rows,
}: {
  rows: readonly EmployeeWalletProjectBreakdownRow[];
}) {
  const t = useTranslations('account.wallet.projects');
  const tp = useTranslations('account.wallet.payout');
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mb-3 text-xs leading-snug">{t('hint')}</p>
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('project')}</TableHead>
              <TableHead>{t('order')}</TableHead>
              <TableHead>{t('productScope')}</TableHead>
              <TableHead className="text-right">{t('planned')}</TableHead>
              <TableHead className="text-right">{t('paid')}</TableHead>
              <TableHead className="text-right">{t('remaining')}</TableHead>
              <TableHead>{t('funding')}</TableHead>
              <TableHead>{t('payout')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center text-sm">
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.orderId}>
                  <TableCell>
                    <Link
                      href={`/projects/${row.projectId}`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {row.project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{row.order.code}</TableCell>
                  <TableCell className="max-w-[12rem] text-xs">{row.productLabel}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.plannedBonus))}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.paidBonus))}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(parseAmount(row.remainingBonus))}
                  </TableCell>
                  <TableCell className="max-w-[12rem] text-[11px] leading-snug">
                    {row.fundingStatusLabels.join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="max-w-[10rem] text-[11px] leading-snug">
                    <span className="text-foreground font-medium">{tp(row.payoutState)}</span>
                    <p className="text-muted-foreground mt-0.5">
                      {tp(WALLET_PAYOUT_EXPLAIN_KEYS[row.payoutState])}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
