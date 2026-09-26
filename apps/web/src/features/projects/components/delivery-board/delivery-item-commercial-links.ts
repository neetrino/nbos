import { FileText, Handshake, KeyRound, Layers, type LucideIcon } from 'lucide-react';
import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { RelationEntityKind } from '@/components/shared/relation-picker/relation-picker.types';

export const COMMERCIAL_UNAVAILABLE_HREF = '#';

export type CommercialLinkTarget = { id: string; label: string };

export type CommercialEntityRowModel = {
  key: string;
  label: string;
  entityKind: RelationEntityKind;
  target: CommercialLinkTarget;
  icon: LucideIcon;
  onOpen: () => void;
};

export function resolveCommercialContact(
  kind: 'PRODUCT' | 'EXTENSION',
  product: FullProduct | null,
  extension: FullExtension | null,
): CommercialLinkTarget | null {
  const project = kind === 'PRODUCT' ? product?.project : extension?.project;
  const contact = project?.contact;
  if (!contact) return null;
  const label = `${contact.firstName} ${contact.lastName}`.trim();
  return label ? { id: contact.id, label } : null;
}

export function resolveCommercialDeal(
  kind: 'PRODUCT' | 'EXTENSION',
  product: FullProduct | null,
  extension: FullExtension | null,
  canViewDeal: boolean,
): CommercialLinkTarget | null {
  if (!canViewDeal) return null;
  const order = kind === 'PRODUCT' ? product?.order : extension?.order;
  const deal = order?.deal;
  return deal?.id ? { id: deal.id, label: getDealDisplayTitle(deal) } : null;
}

export function resolveCommercialOrder(
  kind: 'PRODUCT' | 'EXTENSION',
  product: FullProduct | null,
  extension: FullExtension | null,
): CommercialLinkTarget | null {
  const order = kind === 'PRODUCT' ? product?.order : extension?.order;
  return order ? { id: order.id, label: getOrderDisplayTitle(order) } : null;
}

export function resolveCommercialProduct(
  kind: 'PRODUCT' | 'EXTENSION',
  product: FullProduct | null,
  extension: FullExtension | null,
): CommercialLinkTarget | null {
  const id = kind === 'PRODUCT' ? (product?.id ?? '') : (extension?.productId ?? '');
  const label = product?.name ?? extension?.product.name ?? '';
  return id && label ? { id, label } : null;
}

function commercialRow(
  key: string,
  label: string,
  entityKind: RelationEntityKind,
  target: CommercialLinkTarget,
  icon: LucideIcon,
  onOpen: () => void,
): CommercialEntityRowModel {
  return { key, label, entityKind, target, icon, onOpen };
}

export function buildCommercialEntityRows(input: {
  deal: CommercialLinkTarget | null;
  order: CommercialLinkTarget | null;
  productLink: CommercialLinkTarget | null;
  credentialsHref: string;
  labels: { deal: string; order: string; product: string; credentials: string };
  onOpenDeal: () => void;
  onOpenOrder: () => void;
  onOpenProduct: () => void;
  onOpenCredentials: () => void;
}): CommercialEntityRowModel[] {
  const rows: CommercialEntityRowModel[] = [];
  if (input.deal) {
    rows.push(
      commercialRow('deal', input.labels.deal, 'order', input.deal, Handshake, input.onOpenDeal),
    );
  }
  if (input.order) {
    rows.push(
      commercialRow('order', input.labels.order, 'order', input.order, FileText, input.onOpenOrder),
    );
  }
  if (!input.productLink) return rows;
  rows.push(
    commercialRow(
      'product',
      input.labels.product,
      'product',
      input.productLink,
      Layers,
      input.onOpenProduct,
    ),
  );
  if (input.credentialsHref === COMMERCIAL_UNAVAILABLE_HREF) return rows;
  rows.push(
    commercialRow(
      'credentials',
      input.labels.credentials,
      'credential',
      input.productLink,
      KeyRound,
      input.onOpenCredentials,
    ),
  );
  return rows;
}
