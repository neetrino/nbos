'use client';

import { User } from 'lucide-react';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { ProductEmployee } from '@/lib/api/products';

interface DeliveryItemTeamSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
}

function personLine(label: string, person: ProductEmployee | null | undefined) {
  const name = person ? `${person.firstName} ${person.lastName}` : null;
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={name ? 'font-medium' : 'text-muted-foreground italic'}>
        {name ?? 'Not assigned'}
      </span>
    </div>
  );
}

export function DeliveryItemTeamSection({
  kind,
  product,
  extension,
}: DeliveryItemTeamSectionProps) {
  const pm = kind === 'PRODUCT' ? product?.pm : null;
  const seller =
    kind === 'PRODUCT'
      ? product?.order?.deal?.seller
      : (extension?.order?.deal?.seller ?? undefined);
  const extensionOwner = kind === 'EXTENSION' ? extension?.assignee : null;

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase">
        <User size={14} className="opacity-70" aria-hidden />
        Team
      </h3>
      <div className="space-y-2">
        {kind === 'PRODUCT' ? personLine('Project manager', pm ?? undefined) : null}
        {kind === 'EXTENSION' ? personLine('Owner', extensionOwner ?? undefined) : null}
        {personLine('Seller', seller ?? undefined)}
        {personLine('Developer', undefined)}
        {personLine('Designer', undefined)}
        {personLine('Technical specialist', undefined)}
        {personLine('QA', undefined)}
      </div>
    </section>
  );
}
