'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { DealCompositionCard } from '@/features/crm/deal-constructor/deal-composition-card';
import {
  translateProductPlatformLabel,
  translateProductTypeLabel,
} from '@/features/crm/i18n/crm-copy';
import { DeliveryCompositionLegacyPanel } from '@/features/function-catalog/delivery-composition-legacy-panel';
import {
  extrasFromConfig,
  includedFromConfig,
  ProductFunctionsComposition,
} from '@/features/function-catalog/product-functions-composition';
import type { FunctionsWorkspaceTarget } from '@/features/function-catalog/product-functions-workspace-data';
import type { ProductFunctionsConfig } from '@/features/function-catalog/use-product-functions-workspace';
import { useProductFunctionsWorkspace } from '@/features/function-catalog/use-product-functions-workspace';
import type { ProductFunctionsV2Config } from '@/features/function-catalog/product-functions-volume';

export function DeliveryItemCompositionSection({
  target,
  productType,
  productPlatform,
  orderId,
}: {
  target: FunctionsWorkspaceTarget;
  productType?: string | null;
  productPlatform?: string | null;
  orderId?: string | null;
}) {
  const workspace = useProductFunctionsWorkspace(target);
  if (!workspace.config) return null;
  return (
    <DeliveryCompositionShell
      target={target}
      config={workspace.config}
      catalog={workspace.catalog}
      canAdd={workspace.canAdd}
      canEdit={workspace.canEdit}
      catalogOpen={workspace.catalogOpen}
      setCatalogOpen={workspace.setCatalogOpen}
      onReload={workspace.reload}
      productType={productType}
      productPlatform={productPlatform}
      orderId={orderId ?? null}
    />
  );
}

function DeliveryCompositionShell({
  target,
  config,
  catalog,
  canAdd,
  canEdit,
  catalogOpen,
  setCatalogOpen,
  onReload,
  productType,
  productPlatform,
  orderId,
}: {
  target: FunctionsWorkspaceTarget;
  config: ProductFunctionsConfig;
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canEdit: boolean;
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
  onReload: () => void;
  productType?: string | null;
  productPlatform?: string | null;
  orderId: string | null;
}) {
  const t = useTranslations('crm');
  const [sheetOpen, setSheetOpen] = useState(false);
  const v2 = config.mode === 'V2' ? config : null;
  const extras = v2 ? extrasFromConfig(v2, catalog) : [];
  const included = v2 ? includedFromConfig(v2, catalog) : [];
  const typeLabel = productType ? translateProductTypeLabel(t, productType) : '';
  return (
    <>
      <DealCompositionCard
        hideMoney
        typeLabel={typeLabel}
        platformLabel={productPlatform ? translateProductPlatformLabel(t, productPlatform) : null}
        extraCount={extras.length}
        saleTotal={null}
        unitsTotal={undefined}
        canSeeUnits={false}
        ready
        onOpen={() => setSheetOpen(true)}
      />
      <DeliveryCompositionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        target={target}
        v2={v2}
        extras={extras}
        included={included}
        typeLabel={typeLabel}
        canAdd={canAdd}
        canEdit={canEdit}
        catalogOpen={catalogOpen}
        setCatalogOpen={setCatalogOpen}
        onReload={onReload}
        orderId={orderId}
      />
    </>
  );
}

function DeliveryCompositionSheet({
  open,
  onOpenChange,
  target,
  v2,
  extras,
  included,
  typeLabel,
  canAdd,
  canEdit,
  catalogOpen,
  setCatalogOpen,
  onReload,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FunctionsWorkspaceTarget;
  v2: ProductFunctionsV2Config | null;
  extras: ReturnType<typeof extrasFromConfig>;
  included: ReturnType<typeof includedFromConfig>;
  typeLabel: string;
  canAdd: boolean;
  canEdit: boolean;
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
  onReload: () => void;
  orderId: string | null;
}) {
  const tSheet = useTranslations('crm.dealSheet.dealConstructor');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width="wide" forceNestedBackdrop>
        <div className="flex h-full min-h-0 flex-col p-5">
          {v2 ? (
            <ProductFunctionsComposition
              title={tSheet('compositionSheet')}
              coreTitle={typeLabel || null}
              config={v2}
              extras={extras}
              included={included}
              canAdd={canAdd}
              catalogOpen={catalogOpen}
              setCatalogOpen={setCatalogOpen}
              onReload={onReload}
            />
          ) : (
            <DeliveryCompositionLegacyPanel
              target={target}
              orderId={orderId}
              canEdit={canEdit}
              onAdopted={onReload}
            />
          )}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
