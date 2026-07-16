'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, ExternalLink, FileText, UserCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import {
  ORDER_STATUSES,
  orderStatusLabel,
} from '@/features/finance/components/orders/order-statuses';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';

const OPEN_ID = 'openId';

const COMMERCIAL_ICON_WELL_CLASS =
  'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full';

const COMMERCIAL_ROW_CLASS = 'border-border flex items-center gap-3 border-b py-3 last:border-b-0';

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

function CommercialInfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <div className={COMMERCIAL_ICON_WELL_CLASS}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <p className="text-foreground truncate text-sm font-semibold tracking-tight">{value}</p>
      </div>
      {href ? (
        <ExternalLink className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
      ) : null}
    </>
  );

  if (!href) {
    return <div className={COMMERCIAL_ROW_CLASS}>{body}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        COMMERCIAL_ROW_CLASS,
        'hover:bg-muted/30 -mx-1 rounded-lg px-1 transition-colors',
      )}
    >
      {body}
    </a>
  );
}

function CommercialNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border-border text-foreground hover:bg-muted/30 flex items-center justify-between gap-2 border-b px-0.5 py-2.5 text-sm font-medium transition-colors last:border-b-0 last:pb-1"
    >
      <span>{label}</span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-60" aria-hidden />
    </Link>
  );
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
  const orderStatusMeta = order ? ORDER_STATUSES[order.status] : undefined;
  const productPageLabel = kind === 'PRODUCT' ? 'Product page' : 'Product & extensions';

  return (
    <section
      className={cn(
        'border-border bg-card rounded-xl border px-4 pt-4 pb-2 shadow-sm',
        commercialGateClass,
      )}
    >
      <h3 className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
        Client & order
      </h3>

      <div>
        {contact ? (
          <CommercialInfoRow
            icon={<UserCircle size={16} aria-hidden />}
            label="Client"
            value={`${contact.firstName} ${contact.lastName}`.trim()}
            href={`/clients/contacts?${OPEN_ID}=${encodeURIComponent(contact.id)}`}
          />
        ) : (
          <p className="text-muted-foreground border-border border-b py-3 text-xs">
            No client linked on project.
          </p>
        )}
        {company ? (
          <CommercialInfoRow
            icon={<Building2 size={16} aria-hidden />}
            label="Company"
            value={company.name}
            href={`/clients/companies?${OPEN_ID}=${encodeURIComponent(company.id)}`}
          />
        ) : null}
        {order ? (
          <div className={COMMERCIAL_ROW_CLASS}>
            <div className={cn(COMMERCIAL_ICON_WELL_CLASS, 'rounded-lg')}>
              <FileText size={16} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-foreground truncate text-sm font-semibold tracking-tight">
                {getOrderDisplayTitle(order)}
              </p>
              <StatusBadge
                label={orderStatusLabel(order.status)}
                variant={orderStatusMeta?.variant ?? 'gray'}
              />
            </div>
          </div>
        ) : null}
      </div>

      {deal && dealHref ? (
        <div className="border-border -mx-1 rounded-lg border-b px-1 pt-1.5 pb-3">
          <a
            href={dealHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'inline-flex w-full items-center gap-2 rounded-xl',
            )}
          >
            <FileText size={14} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">
              Open deal {getDealDisplayTitle(deal)}
            </span>
            <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
          </a>
        </div>
      ) : null}

      <nav className={cn(!(deal && dealHref) && 'border-border border-t')}>
        <CommercialNavLink href={financeTabHref} label="Finance tab" />
        <CommercialNavLink href={projectHubHref} label="Project hub" />
        <CommercialNavLink href={sourcePageHref} label={productPageLabel} />
        <CommercialNavLink href={credentialsTabHref} label="Product credentials" />
      </nav>
    </section>
  );
}
