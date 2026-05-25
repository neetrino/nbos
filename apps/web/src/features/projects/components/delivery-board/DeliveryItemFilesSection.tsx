'use client';

import { ExternalLink, File } from 'lucide-react';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';

interface DeliveryItemFilesSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
}

function FileRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border-border bg-background/60 hover:bg-muted/30 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
        <File size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">Open in new tab</p>
      </div>
      <ExternalLink className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </a>
  );
}

export function DeliveryItemFilesSection({
  kind,
  product,
  extension,
}: DeliveryItemFilesSectionProps) {
  const deal = kind === 'PRODUCT' ? product?.order?.deal : extension?.order?.deal;
  const offer = deal?.offerFileUrl?.trim();
  const contract = deal?.contractFileUrl?.trim();

  if (!offer && !contract) {
    return (
      <section className="border-border bg-card/40 rounded-xl border p-4">
        <h3 className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
          Files
        </h3>
        <p className="text-muted-foreground text-xs">
          No offer or contract file URLs on the deal yet.
        </p>
      </section>
    );
  }

  return (
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <h3 className="text-muted-foreground mb-2.5 text-[10px] font-semibold tracking-wider uppercase">
        Files
      </h3>
      <div className="flex flex-col gap-1.5">
        {offer ? <FileRow label="Approved offer" href={offer} /> : null}
        {contract ? <FileRow label="Contract" href={contract} /> : null}
      </div>
    </section>
  );
}
