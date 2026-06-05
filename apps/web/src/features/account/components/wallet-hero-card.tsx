import { Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { WalletOverviewMetrics } from '@/features/account/utils/wallet-overview-metrics';
import { cn } from '@/lib/utils';

interface WalletHeroCardProps {
  metrics: WalletOverviewMetrics;
}

function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-primary-foreground/15 bg-primary-foreground/10 rounded-xl border px-3 py-2 backdrop-blur-sm',
        className,
      )}
    >
      <p className="text-primary-foreground/70 text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-primary-foreground mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function WalletHeroCard({ metrics }: WalletHeroCardProps) {
  const progress = metrics.nextPayrollProgress;

  return (
    <div className="from-primary via-primary to-primary/85 text-primary-foreground relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-lg">
      <div
        className="bg-primary-foreground/10 pointer-events-none absolute -top-10 -right-10 size-40 rounded-full"
        aria-hidden
      />
      <div
        className="bg-primary-foreground/5 pointer-events-none absolute -bottom-16 -left-8 size-48 rounded-full"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-primary-foreground/75 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <Wallet size={14} aria-hidden />
            NBOS Wallet
          </div>
          <p className="mt-2 truncate text-sm font-medium opacity-90">{metrics.displayName}</p>
          {metrics.roleLine ? (
            <p className="text-primary-foreground/65 truncate text-xs">{metrics.roleLine}</p>
          ) : null}
        </div>
        <div className="bg-primary-foreground/15 flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Sparkles size={18} className="text-primary-foreground/90" aria-hidden />
        </div>
      </div>

      <div className="relative mt-6">
        <p className="text-primary-foreground/75 text-xs font-medium">{metrics.heroLabel}</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
          {formatAmount(metrics.heroAmount)}
        </p>
        <p className="text-primary-foreground/65 mt-2 max-w-md text-xs leading-relaxed">
          {metrics.heroSublabel}
        </p>
      </div>

      {progress != null ? (
        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium tracking-wide uppercase opacity-80">
            <span>Payroll progress</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="bg-primary-foreground/20 flex h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary-foreground h-full rounded-l-full transition-all"
              style={{ flexGrow: progress, flexBasis: 0 }}
            />
            <div
              className="h-full"
              style={{ flexGrow: 100 - progress, flexBasis: 0 }}
              aria-hidden
            />
          </div>
        </div>
      ) : null}

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <StatPill
          label="Base"
          value={metrics.baseSalary > 0 ? formatAmount(metrics.baseSalary) : '—'}
        />
        <StatPill label="Incoming" value={formatAmount(metrics.incomingTotal)} />
        <StatPill
          label="Paid"
          value={formatAmount(metrics.paidFromPayroll)}
          className="col-span-1"
        />
      </div>

      <div className="text-primary-foreground/60 relative mt-4 flex items-center gap-1.5 text-[10px]">
        <TrendingUp size={12} aria-hidden />
        Read-only compensation view — not a bank account.
      </div>
    </div>
  );
}
