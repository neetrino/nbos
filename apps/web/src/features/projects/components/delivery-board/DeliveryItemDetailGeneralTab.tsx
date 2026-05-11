'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import type { DeliveryBoardItem } from './project-delivery-board-model';
import { DeliveryAccessInfrastructureSection } from './DeliveryAccessInfrastructureSection';
import {
  ExtensionPlanningSection,
  ProductPlanningSection,
} from './delivery-item-detail-general-planning-sections';
import type {
  ExtensionPlanSnapshot,
  ProductPlanSnapshot,
} from './delivery-item-detail-planning-state';

interface DeliveryItemDetailGeneralTabProps {
  item: DeliveryBoardItem;
  product: FullProduct | null;
  extension: FullExtension | null;
  lifecycle: DeliveryLifecycleProjection | undefined;
  sourcePageHref: string;
  credentialsTabHref: string;
  projectHubHref: string;
  financeTabHref: string;
  onRefreshDetail: () => void;
  productPlan: ProductPlanSnapshot | null;
  onProductPlanChange: (next: ProductPlanSnapshot) => void;
  extensionPlan: ExtensionPlanSnapshot | null;
  onExtensionPlanChange: (next: ExtensionPlanSnapshot) => void;
  planningDisabled: boolean;
}

export function DeliveryItemDetailGeneralTab({
  item,
  product,
  extension,
  lifecycle,
  sourcePageHref,
  credentialsTabHref,
  projectHubHref,
  financeTabHref,
  onRefreshDetail,
  productPlan,
  onProductPlanChange,
  extensionPlan,
  onExtensionPlanChange,
  planningDisabled,
}: DeliveryItemDetailGeneralTabProps) {
  const projectId =
    item.kind === 'PRODUCT'
      ? (item.product.projectId ?? item.product.project?.id ?? '')
      : (item.extension.projectId ?? item.extension.project?.id ?? '');
  const productId = item.kind === 'PRODUCT' ? item.product.id : item.extension.productId;

  if (!product && !extension) {
    return <p className="text-muted-foreground px-5 py-8 text-sm sm:px-7">Nothing to edit yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-5 sm:flex-row sm:px-7">
      <div className="min-w-0 flex-1 space-y-6">
        {product && productPlan ? (
          <ProductPlanningSection
            product={product}
            draft={productPlan}
            onDraftChange={onProductPlanChange}
            disabled={planningDisabled}
          />
        ) : null}
        {extension && extensionPlan ? (
          <ExtensionPlanningSection
            extension={extension}
            draft={extensionPlan}
            onDraftChange={onExtensionPlanChange}
            disabled={planningDisabled}
          />
        ) : null}

        <DeliveryAccessInfrastructureSection
          projectId={projectId}
          productId={productId}
          productCredentialsHref={credentialsTabHref}
          onRefreshDetail={onRefreshDetail}
        />
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 sm:w-64">
        <div className="border-border bg-card/50 rounded-xl border p-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Context
          </p>
          {lifecycle ? (
            <div className="mt-3">
              <StatusBadge
                label={formatDeliveryLifecycleLabel(lifecycle)}
                variant={getDeliveryLifecycleVariant(lifecycle)}
              />
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">No delivery stage data.</p>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={projectHubHref} className="text-primary font-medium hover:underline">
                Project hub →
              </Link>
            </li>
            <li>
              <Link href={sourcePageHref} className="text-primary font-medium hover:underline">
                {product ? 'Product page →' : 'Product & extensions →'}
              </Link>
            </li>
            <li>
              <Link href={credentialsTabHref} className="text-primary font-medium hover:underline">
                Product credentials →
              </Link>
            </li>
            <li>
              <Link href={financeTabHref} className="text-primary font-medium hover:underline">
                Finance →
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
