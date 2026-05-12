'use client';

import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
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
import { DeliveryItemStageReadinessSection } from './DeliveryItemStageReadinessSection';
import { DeliveryStageChecklistPanel } from './DeliveryStageChecklistPanel';
import { DeliveryItemTeamSection } from './DeliveryItemTeamSection';
import { DeliveryItemCommercialSection } from './DeliveryItemCommercialSection';
import { DeliveryItemKeyWorkLinksSection } from './DeliveryItemKeyWorkLinksSection';
import { DeliveryItemFilesSection } from './DeliveryItemFilesSection';
import { DeliveryItemLanguagesMultiselect } from './DeliveryItemLanguagesMultiselect';
import { DeliveryItemPaymentSummary } from './DeliveryItemLanguagesPanel';

interface DeliveryItemDetailGeneralTabProps {
  item: DeliveryBoardItem;
  product: FullProduct | null;
  extension: FullExtension | null;
  lifecycle: DeliveryLifecycleProjection | undefined;
  workSpaceHref: string;
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
  workSpaceHref,
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

  const kind = item.kind;
  const checklistProgress =
    kind === 'PRODUCT'
      ? (product?.checklistStageProgress ?? item.product.checklistStageProgress)
      : (extension?.checklistStageProgress ?? item.extension.checklistStageProgress);

  if (!product && !extension) {
    return <p className="text-muted-foreground px-5 py-8 text-sm sm:px-7">Nothing to edit yet.</p>;
  }

  return (
    <div className="space-y-4 px-5 py-4 sm:px-7">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-5">
        <div className="flex flex-col gap-4">
          <DeliveryItemStageReadinessSection
            kind={kind}
            product={product}
            extension={extension}
            lifecycle={lifecycle}
            checklistProgress={checklistProgress}
          />
          <DeliveryStageChecklistPanel
            ownerEntityType={kind}
            ownerEntityId={kind === 'PRODUCT' ? productId : item.extension.id}
            lifecycle={lifecycle}
            onChanged={onRefreshDetail}
            floatingNav={{
              sourcePageHref,
              workspaceHref: workSpaceHref,
            }}
          />
          <DeliveryItemTeamSection
            kind={kind}
            product={product}
            extension={extension}
            productPlan={productPlan}
            extensionPlan={extensionPlan}
            onProductPlanChange={onProductPlanChange}
            onExtensionPlanChange={onExtensionPlanChange}
            disabled={planningDisabled}
          />
          {kind === 'PRODUCT' && productPlan && product ? (
            <section className="border-border bg-card/40 space-y-3 rounded-xl border p-4">
              <DeliveryItemLanguagesMultiselect
                value={productPlan.languages}
                onChange={(languages) => onProductPlanChange({ ...productPlan, languages })}
                disabled={planningDisabled}
              />
              <DeliveryItemPaymentSummary paymentType={product.order?.paymentType} />
            </section>
          ) : null}
          {kind === 'EXTENSION' && extension ? (
            <section className="border-border bg-card/40 space-y-3 rounded-xl border p-4">
              <DeliveryItemLanguagesMultiselect
                value={extension.product.languages ?? []}
                readOnly
                disabled={planningDisabled}
              />
              <DeliveryItemPaymentSummary paymentType={extension.order?.paymentType} />
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
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
          <DeliveryItemCommercialSection
            kind={kind}
            product={product}
            extension={extension}
            financeTabHref={financeTabHref}
            projectHubHref={projectHubHref}
            sourcePageHref={sourcePageHref}
            credentialsTabHref={credentialsTabHref}
          />
          <DeliveryItemKeyWorkLinksSection
            kind={kind}
            product={product}
            extension={extension}
            workSpaceHref={workSpaceHref}
          />
        </div>

        <div className="flex flex-col gap-4">
          <DeliveryAccessInfrastructureSection
            projectId={projectId}
            productId={productId}
            productCredentialsHref={credentialsTabHref}
            onRefreshDetail={onRefreshDetail}
          />
          <DeliveryItemFilesSection kind={kind} product={product} extension={extension} />
        </div>
      </div>
    </div>
  );
}
