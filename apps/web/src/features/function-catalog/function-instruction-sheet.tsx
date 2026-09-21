'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { FunctionPricingPanel } from './function-pricing-panel';

export function FunctionInstructionSheet({ item }: { item: DeliveryFunctionOperationalDto }) {
  const t = useTranslations('hr.functionCatalog');

  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">{item.title}</h2>
        <p className="text-muted-foreground text-sm">{item.summary}</p>
      </header>
      <section className="space-y-1">
        <h3 className="text-foreground text-sm font-semibold">{t('scope')}</h3>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.scopeBoundaries}</p>
      </section>
      <section className="space-y-1">
        <h3 className="text-foreground text-sm font-semibold">{t('instructions')}</h3>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.instructions}</p>
      </section>
      <section className="space-y-1">
        <h3 className="text-foreground text-sm font-semibold">{t('acceptance')}</h3>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.acceptanceCriteria}</p>
      </section>
      <FunctionPricingPanel functionId={item.id} />
    </article>
  );
}
