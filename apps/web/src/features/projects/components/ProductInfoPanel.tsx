'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, CalendarPlus, Cloud, FolderKanban, Layers, User, Wallet } from 'lucide-react';
import { ActionTileButton, StatusBadge } from '@/components/shared';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { buildDriveHrefWithProduct } from '@/features/drive/drive-deep-link';
import { getProductDeliveryStageBadgeDisplay } from '@/features/projects/constants/delivery-stage-display';
import { getProductType } from '@/features/projects/constants/projects';
import {
  OverviewMetaGrid,
  OverviewMetaTile,
} from '@/features/projects/components/product-tabs/product-overview-ui';
import { ProductSettingsSheet } from '@/features/projects/components/ProductSettingsSheet';
import { productStageGateFieldClass } from '@/features/projects/product-stage-gate-highlight';
import type { FullProduct } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { DeliveryDealPanelActions } from '@/features/projects/components/delivery-deal-action-tiles';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { DetailInfoSubsection } from './detail-info-subsection';

interface ProductInfoPanelProps {
  product: FullProduct;
  gateRequiredFields: ReadonlySet<string>;
  className?: string;
}

export function ProductInfoPanel({
  product,
  gateRequiredFields,
  className,
}: ProductInfoPanelProps) {
  const searchParams = useSearchParams();
  const [whatsappOpen, setWhatsappOpen] = useState(
    () => searchParams.get('settings') === 'whatsapp',
  );
  const description = product.description?.trim();
  const hasDescription = Boolean(description);
  const forceDescription = gateRequiredFields.has('description');
  const productType = getProductType(product.productType);
  const stageStatus = getProductDeliveryStageBadgeDisplay(product);
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const dealId = getEntityOrderDealId(product.order);
  const isMobileViewport = useIsMobileViewport();
  const driveHref = buildDriveHrefWithProduct(product.id);

  return (
    <aside
      className={cn('bg-card border-border rounded-xl border p-5', className)}
      aria-label="Product information"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-0 text-xs')}>About product</h2>
          <p className="text-muted-foreground mt-0.5 truncate text-xs font-medium">
            {productType?.label ?? product.productType}
            <span className="mx-1.5 opacity-40">·</span>
            {product.project.name}
          </p>
        </div>
        {isMobileViewport ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <ActionTileButton
              label="Drive"
              href={driveHref}
              openInNewTab={false}
              tone="sky"
              size="md"
              fullWidth
              icon={<Cloud aria-hidden />}
            />
            <ProductSettingsSheet
              productId={product.id}
              triggerVariant="tile"
              open={whatsappOpen}
              onOpenChange={setWhatsappOpen}
            />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <EntityDriveNavAction href={driveHref} />
            <ProductSettingsSheet
              productId={product.id}
              triggerVariant="inline"
              open={whatsappOpen}
              onOpenChange={setWhatsappOpen}
            />
          </div>
        )}
      </div>

      <DeliveryDealPanelActions
        className="mt-4"
        onOpenDeliveryCard={() => openDeliveryItem(`product-${product.id}`)}
        onOpenDeal={dealId ? () => openDeal(dealId) : undefined}
      />

      <div className="mt-4">
        {(hasDescription || forceDescription) && (
          <DetailInfoSubsection first>
            <div
              className={productStageGateFieldClass(gateRequiredFields, 'description', undefined)}
            >
              {description ? (
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Description is required before Starting.
                </p>
              )}
            </div>
          </DetailInfoSubsection>
        )}

        <DetailInfoSubsection first={!hasDescription && !forceDescription} className="pb-3">
          <OverviewMetaGrid>
            <OverviewMetaTile
              label="Stage"
              icon={Layers}
              iconTone="purple"
              value={
                stageStatus ? (
                  <StatusBadge label={stageStatus.label} variant={stageStatus.variant} />
                ) : (
                  '—'
                )
              }
            />
            {product.pm ? (
              <OverviewMetaTile
                label="PM"
                icon={User}
                iconTone="sky"
                value={`${product.pm.firstName} ${product.pm.lastName}`}
              />
            ) : null}
            <OverviewMetaTile
              label="Deadline"
              icon={Calendar}
              iconTone="amber"
              className={productStageGateFieldClass(gateRequiredFields, 'deadline', undefined)}
              value={product.deadline ? new Date(product.deadline).toLocaleDateString() : '—'}
            />
            <OverviewMetaTile
              label="Order"
              icon={Wallet}
              iconTone="emerald"
              className={productStageGateFieldClass(gateRequiredFields, 'order', undefined)}
              value={product.order ? 'Linked' : '—'}
            />
            <OverviewMetaTile
              label="Project"
              icon={FolderKanban}
              iconTone="blue"
              value={
                <Link
                  href={`/projects/${product.projectId}`}
                  className="text-primary block truncate hover:underline"
                >
                  {product.project.name}
                </Link>
              }
            />
            <OverviewMetaTile
              label="Created"
              icon={CalendarPlus}
              iconTone="slate"
              value={new Date(product.createdAt).toLocaleDateString()}
            />
          </OverviewMetaGrid>
        </DetailInfoSubsection>
      </div>
    </aside>
  );
}
