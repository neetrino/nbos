'use client';

import { WALLET_COMPENSATION_GLOSSARY } from '@/features/finance/constants/employee-wallet-explanations';

export function WalletCompensationGlossary() {
  return (
    <section className="border-border bg-muted/20 rounded-2xl border px-4 py-3">
      <h2 className="text-foreground text-sm font-semibold">How to read this wallet</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Amounts are planned compensation from NBOS, not your bank balance. Tap a payroll month for
        detail.
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {WALLET_COMPENSATION_GLOSSARY.map((item) => (
          <div key={item.term}>
            <dt className="text-foreground text-xs font-medium">{item.term}</dt>
            <dd className="text-muted-foreground mt-0.5 text-[11px] leading-snug">{item.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
