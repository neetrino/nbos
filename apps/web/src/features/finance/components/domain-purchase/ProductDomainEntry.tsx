'use client';

import { useState } from 'react';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import { ClientServiceDetailSheet } from '@/features/finance/components/client-services/ClientServiceDetailSheet';
import { usePermission } from '@/lib/permissions';
import { DomainPurchaseSheet } from './DomainPurchaseSheet';
import { ProductDomainStatusChip } from './ProductDomainStatusChip';
import { useProductDomainServices } from './use-product-domain-services';

interface ProductDomainEntryProps {
  productId: string;
  className?: string;
}

export function ProductDomainEntry({ productId, className }: ProductDomainEntryProps) {
  const { can, isLoading } = usePermission();
  const canView = can('VIEW', FINANCE_CLIENT_SERVICES_MODULE);
  const canAdd = can('ADD', FINANCE_CLIENT_SERVICES_MODULE);
  const { rows, refresh } = useProductDomainServices(canView ? productId : null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);

  if (isLoading || (!canView && !canAdd)) return null;
  if (!canAdd && rows.length === 0) return null;

  return (
    <div className={className}>
      <ProductDomainStatusChip rows={canView ? rows : []} onClick={() => setSheetOpen(true)} />
      <DomainPurchaseSheet
        open={sheetOpen}
        productId={productId}
        services={canView ? rows : []}
        canAdd={canAdd}
        onOpenChange={setSheetOpen}
        onSaved={() => void refresh()}
        onOpenService={(id) => {
          setSheetOpen(false);
          setServiceId(id);
        }}
      />
      <ClientServiceDetailSheet
        serviceId={serviceId}
        open={Boolean(serviceId)}
        onOpenChange={(open) => {
          if (!open) setServiceId(null);
        }}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
