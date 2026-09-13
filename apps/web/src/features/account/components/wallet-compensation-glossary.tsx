'use client';

import { useTranslations } from 'next-intl';
import { WALLET_GLOSSARY_KEYS } from '@/features/account/constants/wallet-ui';

export function WalletCompensationGlossary() {
  const t = useTranslations('account.wallet.glossary');

  return (
    <section className="border-border bg-muted/20 rounded-2xl border px-4 py-3">
      <h2 className="text-foreground text-sm font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">{t('intro')}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {WALLET_GLOSSARY_KEYS.map((item) => (
          <div key={item.term}>
            <dt className="text-foreground text-xs font-medium">{t(item.term)}</dt>
            <dd className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
              {t(item.text)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
