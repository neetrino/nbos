'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingState, StatusBadge } from '@/components/shared';
import { EntityDriveNavAction } from '@/features/drive/EntityDriveNavAction';
import { buildDriveHrefWithProduct } from '@/features/drive/drive-deep-link';
import { ProductParticipantsSection } from '@/features/platform-access/components/ProductParticipantsSection';
import { getProductDeliveryStageBadgeDisplay } from '@/features/projects/constants/delivery-stage-display';
import { getProductType } from '@/features/projects/constants/projects';
import {
  OverviewMetaGrid,
  OverviewMetaTile,
} from '@/features/projects/components/product-tabs/product-overview-ui';
import { productStageGateFieldClass } from '@/features/projects/product-stage-gate-highlight';
import type { FullProduct } from '@/lib/api/products';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { DeliveryDealPanelActions } from '@/features/projects/components/delivery-deal-action-tiles';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
import { DetailInfoSubsection } from './detail-info-subsection';
import { ProjectContactsSection } from './ProjectContactsSection';

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
  const [project, setProject] = useState<FullProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  const loadProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      const data = await projectsApi.getById(product.projectId);
      setProject(data);
    } catch {
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  }, [product.projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const description = product.description?.trim();
  const hasDescription = Boolean(description);
  const forceDescription = gateRequiredFields.has('description');
  const productType = getProductType(product.productType);
  const stageStatus = getProductDeliveryStageBadgeDisplay(product);
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const dealId = getEntityOrderDealId(product.order);

  return (
    <aside
      className={cn('bg-card border-border rounded-xl border p-5', className)}
      aria-label="Product information"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">About product</h2>
          <p className="text-muted-foreground mt-0.5 truncate text-xs font-medium">
            {productType?.label ?? product.productType}
            <span className="mx-1.5 opacity-40">·</span>
            {product.project.name}
          </p>
        </div>
        <EntityDriveNavAction href={buildDriveHrefWithProduct(product.id)} className="shrink-0" />
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
                value={`${product.pm.firstName} ${product.pm.lastName}`}
              />
            ) : null}
            <OverviewMetaTile
              label="Deadline"
              className={productStageGateFieldClass(gateRequiredFields, 'deadline', undefined)}
              value={product.deadline ? new Date(product.deadline).toLocaleDateString() : '—'}
            />
            <OverviewMetaTile
              label="Order"
              className={productStageGateFieldClass(gateRequiredFields, 'order', undefined)}
              value={product.order ? 'Linked' : '—'}
            />
            <OverviewMetaTile
              label="Project"
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
              value={new Date(product.createdAt).toLocaleDateString()}
            />
          </OverviewMetaGrid>
          <div className="mt-4">
            {projectLoading ? (
              <LoadingState count={2} />
            ) : project ? (
              <ProjectContactsSection embedded project={project} onProjectUpdated={setProject} />
            ) : (
              <p className="text-muted-foreground text-xs">Could not load project contacts.</p>
            )}
          </div>
        </DetailInfoSubsection>

        <DetailInfoSubsection title="Product team" className="mt-4 pt-6">
          <ProductParticipantsSection productId={product.id} embedded />
        </DetailInfoSubsection>
      </div>
    </aside>
  );
}
