'use client';

import Link from 'next/link';
import { Building2, ExternalLink, FileText, UserCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';

const OPEN_ID = 'openId';

interface DeliveryItemCommercialSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  financeTabHref: string;
  projectHubHref: string;
  sourcePageHref: string;
  credentialsTabHref: string;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DeliveryItemCommercialSection({
  kind,
  product,
  extension,
  financeTabHref,
  projectHubHref,
  sourcePageHref,
  credentialsTabHref,
  gateRequiredFields = new Set(),
}: DeliveryItemCommercialSectionProps) {
  const commercialGateClass =
    gateRequiredFields.has('order') || gateRequiredFields.has('finance')
      ? deliveryStageGateSectionClass(gateRequiredFields, 'order', 'rounded-xl')
      : undefined;
  const project = kind === 'PRODUCT' ? product?.project : extension?.project;
  const order = kind === 'PRODUCT' ? product?.order : extension?.order;
  const deal = order?.deal;

  const contact = project?.contact;
  const company = project?.company;
  const dealHref = deal?.id ? `/crm/deals?openDealId=${encodeURIComponent(deal.id)}` : null;

  return (
    <section className={cn('border-border bg-card/40 rounded-xl border p-4', commercialGateClass)}>
      <h3 className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-wider uppercase">
        Client & order
      </h3>
      <div className="space-y-2.5 text-sm">
        {contact ? (
          <div className="flex items-start justify-between gap-2">
            <div className="text-muted-foreground flex items-center gap-2">
              <UserCircle size={14} className="shrink-0 opacity-70" aria-hidden />
              <span>Client</span>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <Link
                href={`/clients/contacts?${OPEN_ID}=${encodeURIComponent(contact.id)}`}
                className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {contact.firstName} {contact.lastName}
                <ExternalLink className="size-3.5 opacity-60" aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No client linked on project.</p>
        )}
        {company ? (
          <div className="flex items-start justify-between gap-2">
            <div className="text-muted-foreground flex items-center gap-2">
              <Building2 size={14} className="shrink-0 opacity-70" aria-hidden />
              <span>Company</span>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <Link
                href={`/clients/companies?${OPEN_ID}=${encodeURIComponent(company.id)}`}
                className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {company.name}
                <ExternalLink className="size-3.5 opacity-60" aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
        {order ? (
          <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
            <span className="text-foreground font-medium">Order {order.code}</span>
            <span>·</span>
            <span>{order.status}</span>
          </div>
        ) : null}
        {deal && dealHref ? (
          <a
            href={dealHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex w-full gap-2',
            )}
          >
            <FileText size={14} aria-hidden />
            Open deal {deal.code}
            <ExternalLink className="ml-auto size-3.5 opacity-60" aria-hidden />
          </a>
        ) : null}
        <Link href={financeTabHref} className="text-primary text-xs font-medium hover:underline">
          Finance tab →
        </Link>
        <div className="border-border flex flex-col gap-1 border-t pt-3">
          <Link href={projectHubHref} className="text-primary text-xs font-medium hover:underline">
            Project hub →
          </Link>
          <Link href={sourcePageHref} className="text-primary text-xs font-medium hover:underline">
            {kind === 'PRODUCT' ? 'Product page →' : 'Product & extensions →'}
          </Link>
          <Link
            href={credentialsTabHref}
            className="text-primary text-xs font-medium hover:underline"
          >
            Product credentials →
          </Link>
        </div>
      </div>
    </section>
  );
}
