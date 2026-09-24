import type { ReactNode } from 'react';
import { SECTION_CARD_CLASS } from './delivery-norms.constants';

export function DeliveryNormsSectionCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={SECTION_CARD_CLASS}>
      {title || description ? (
        <div className="space-y-1">
          {title ? <h2 className="text-foreground text-base font-semibold">{title}</h2> : null}
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
