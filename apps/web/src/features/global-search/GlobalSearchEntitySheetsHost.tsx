'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { EntityItemHost, useEntityItemHost } from '@/components/shared';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { EntityLeadSheetDeepLink } from '@/features/crm/components/EntityLeadSheetDeepLink';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import type { SearchHit } from '@/lib/api/search';
import { GlobalSearchProductSheet } from './GlobalSearchProductSheet';
import { opensGlobalSearchInPlaceSheet } from './global-search-in-place';
import {
  GlobalSearchEntitySheetsProvider,
  type GlobalSearchEntitySheetsApi,
} from './global-search-entity-sheets-context';

function GlobalSearchEntitySheetsHostInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { openEntityItem } = useEntityItemHost();

  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const [dealOpen, setDealOpen] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);

  const openSearchHit = useCallback(
    (hit: SearchHit) => {
      if (!opensGlobalSearchInPlaceSheet(hit.entityType)) {
        router.push(hit.href);
        return;
      }

      switch (hit.entityType) {
        case 'lead':
          setLeadId(hit.id);
          setLeadOpen(true);
          return;
        case 'deal':
          setDealId(hit.id);
          setDealOpen(true);
          return;
        case 'credential':
          setCredentialId(hit.id);
          setCredentialOpen(true);
          return;
        case 'product':
          setProductId(hit.id);
          setProductOpen(true);
          return;
        case 'order':
          setOrderId(hit.id);
          setOrderOpen(true);
          return;
        case 'subscription':
          setSubscriptionId(hit.id);
          setSubscriptionOpen(true);
          return;
        case 'invoice':
          openEntityItem({ kind: 'invoice', id: hit.id });
          return;
        case 'expense':
          openEntityItem({ kind: 'expense', id: hit.id });
          return;
        default:
          router.push(hit.href);
      }
    },
    [openEntityItem, router],
  );

  const api = useMemo<GlobalSearchEntitySheetsApi>(() => ({ openSearchHit }), [openSearchHit]);

  return (
    <GlobalSearchEntitySheetsProvider value={api}>
      {children}

      <EntityLeadSheetDeepLink
        leadId={leadId}
        open={leadOpen}
        onOpenChange={(next) => {
          setLeadOpen(next);
          if (!next) setLeadId(null);
        }}
      />

      <EntityDealSheetDeepLink
        dealId={dealId}
        open={dealOpen}
        onOpenChange={(next) => {
          setDealOpen(next);
          if (!next) setDealId(null);
        }}
        forceNestedBackdrop
      />

      <CredentialFormSheet
        open={credentialOpen}
        onOpenChange={(next) => {
          setCredentialOpen(next);
          if (!next) setCredentialId(null);
        }}
        credentialId={credentialId}
        forceNestedBackdrop
      />

      <OrderDetailSheet
        orderId={orderId}
        open={orderOpen}
        onOpenChange={(next) => {
          setOrderOpen(next);
          if (!next) setOrderId(null);
        }}
        onCreateInvoice={() => undefined}
        forceNestedBackdrop
      />

      <SubscriptionDetailSheet
        subscriptionId={subscriptionId}
        open={subscriptionOpen}
        onOpenChange={(next) => {
          setSubscriptionOpen(next);
          if (!next) setSubscriptionId(null);
        }}
      />

      <GlobalSearchProductSheet
        productId={productId}
        open={productOpen}
        onOpenChange={(next) => {
          setProductOpen(next);
          if (!next) setProductId(null);
        }}
      />
    </GlobalSearchEntitySheetsProvider>
  );
}

/** App-wide sheet host for global search result opens (no route change). */
export function GlobalSearchEntitySheetsHost({ children }: { children: ReactNode }) {
  return (
    <EntityItemHost nested>
      <GlobalSearchEntitySheetsHostInner>{children}</GlobalSearchEntitySheetsHostInner>
    </EntityItemHost>
  );
}
