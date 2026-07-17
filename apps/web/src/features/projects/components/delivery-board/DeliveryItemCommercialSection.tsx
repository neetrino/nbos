'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderKanban,
  KeyRound,
  Package,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import {
  ORDER_STATUSES,
  orderStatusLabel,
} from '@/features/finance/components/orders/order-statuses';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';

const COMMERCIAL_ICON_WELL_CLASS =
  'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full';

const COMMERCIAL_ROW_CLASS = 'border-border flex items-center gap-3 border-b py-3 last:border-b-0';

const COMMERCIAL_ACTION_BTN_CLASS = cn(
  buttonVariants({ variant: 'default', size: 'sm' }),
  'inline-flex w-full items-center gap-2 rounded-xl',
);

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
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onOpen?: () => void;
}) {
  const body = (
    <>
      <div className={COMMERCIAL_ICON_WELL_CLASS}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <p className="text-foreground truncate text-sm font-semibold tracking-tight">{value}</p>
      </div>
      {onOpen ? (
        <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
      ) : null}
    </>
  );

  if (!onOpen) {
    return <div className={COMMERCIAL_ROW_CLASS}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        COMMERCIAL_ROW_CLASS,
        'hover:bg-muted/30 -mx-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-lg px-1 text-left transition-colors',
      )}
    >
      {body}
    </button>
  );
}

function CommercialNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className={COMMERCIAL_ACTION_BTN_CLASS}>
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <ExternalLink className="size-3.5 shrink-0 opacity-50" aria-hidden />
    </Link>
  );
}

function CommercialNavButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(COMMERCIAL_ACTION_BTN_CLASS, disabled && 'pointer-events-none opacity-50')}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
    </button>
  );
}

export function DeliveryItemCommercialSection({
  kind,
  product,
  extension,
  projectHubHref,
  sourcePageHref,
  credentialsTabHref,
  gateRequiredFields = new Set(),
}: DeliveryItemCommercialSectionProps) {
  const relations = useEntityRelations();
  const [dealSheetOpen, setDealSheetOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const commercialGateClass =
    gateRequiredFields.has('order') || gateRequiredFields.has('finance')
      ? deliveryStageGateSectionClass(gateRequiredFields, 'order', 'rounded-xl')
      : undefined;
  const project = kind === 'PRODUCT' ? product?.project : extension?.project;
  const order = kind === 'PRODUCT' ? product?.order : extension?.order;
  const deal = order?.deal;

  const contact = project?.contact;
  const company = project?.company;
  const orderStatusMeta = order ? ORDER_STATUSES[order.status] : undefined;
  const productPageLabel = kind === 'PRODUCT' ? 'Product page' : 'Product & extensions';
  const dealId = deal?.id ?? null;
  const orderId = order?.id ?? null;

  return (
    <>
      <section
        className={cn(
          'border-border bg-card rounded-xl border px-4 pt-4 pb-2 shadow-sm',
          commercialGateClass,
        )}
      >
        <h3 className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
          Client & order
        </h3>

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0">
            {contact ? (
              <CommercialInfoRow
                icon={<UserCircle size={16} aria-hidden />}
                label="Client"
                value={`${contact.firstName} ${contact.lastName}`.trim()}
                onOpen={() => relations.openEntity('contact', contact.id)}
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
                onOpen={() => relations.openEntity('company', company.id)}
              />
            ) : null}
            {order ? (
              <button
                type="button"
                onClick={() => setOrderSheetOpen(true)}
                className={cn(
                  COMMERCIAL_ROW_CLASS,
                  'hover:bg-muted/30 -mx-1 w-[calc(100%+0.5rem)] cursor-pointer rounded-lg px-1 text-left transition-colors',
                )}
              >
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
                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0 opacity-70"
                  aria-hidden
                />
              </button>
            ) : null}
          </div>

          <nav className="border-border flex min-w-0 flex-col gap-1.5 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
            {dealId ? (
              <CommercialNavButton
                label={`Open deal ${getDealDisplayTitle(deal!)}`}
                icon={<FileText size={14} aria-hidden />}
                onClick={() => setDealSheetOpen(true)}
              />
            ) : null}
            <CommercialNavButton
              label="Finance tab"
              icon={<Wallet size={14} aria-hidden />}
              onClick={() => setOrderSheetOpen(true)}
              disabled={!orderId}
            />
            <CommercialNavLink
              href={projectHubHref}
              label="Project hub"
              icon={<FolderKanban size={14} aria-hidden />}
            />
            <CommercialNavLink
              href={sourcePageHref}
              label={productPageLabel}
              icon={<Package size={14} aria-hidden />}
            />
            <CommercialNavLink
              href={credentialsTabHref}
              label="Product credentials"
              icon={<KeyRound size={14} aria-hidden />}
            />
          </nav>
        </div>
      </section>

      <EntityDealSheetDeepLink
        dealId={dealSheetOpen ? dealId : null}
        open={dealSheetOpen && Boolean(dealId)}
        onOpenChange={setDealSheetOpen}
        forceNestedBackdrop
      />

      <OrderDetailSheet
        orderId={orderSheetOpen ? orderId : null}
        open={orderSheetOpen && Boolean(orderId)}
        onOpenChange={setOrderSheetOpen}
        onCreateInvoice={() => undefined}
        forceNestedBackdrop
      />
    </>
  );
}
