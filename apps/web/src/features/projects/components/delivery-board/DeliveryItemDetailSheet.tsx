'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DetailSheetFormFooter } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { extensionsApi, type FullExtension } from '@/lib/api/extensions';
import { productsApi, type FullProduct } from '@/lib/api/products';
import type { DeliveryActiveStage } from './project-delivery-board-actions';
import {
  buildExtensionPlanPatch,
  buildProductPlanPatch,
  snapshotExtensionPlan,
  snapshotProductPlan,
  type ExtensionPlanSnapshot,
  type ProductPlanSnapshot,
} from './delivery-item-detail-planning-state';
import {
  DeliveryPipelineStages,
  DELIVERY_PIPELINE_CANCEL_KEY,
  DELIVERY_PIPELINE_DONE_KEY,
  type DeliveryPipelineClickKey,
} from './DeliveryPipelineStages';
import {
  getItemId,
  getItemLabel,
  ACTIVE_DELIVERY_STAGES,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import {
  resolveDeliveryDetailPanelFromErrors,
  splitDeliveryStageGateErrors,
  type DeliverySheetStageGateHighlight,
} from './delivery-stage-gate-highlight';
import type { UseDeliveryBoardMutationsResult } from './use-delivery-board-mutations';
import { mergeDeliveryDetailLifecycle } from './delivery-item-detail-merge-lifecycle';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';
import {
  extensionToDeliveryBoardItem,
  productToDeliveryBoardItem,
} from './delivery-board-item-adapters';
import { DeliveryItemDetailHeader } from './DeliveryItemDetailHeader';
import { DeliveryItemDetailTabBar } from './DeliveryItemDetailTabBar';
import { DeliveryItemDetailSecondaryPanels } from './DeliveryItemDetailSecondaryPanels';
import { DeliveryItemDetailGeneralTab } from './DeliveryItemDetailGeneralTab';
import { EntitySheetFloatingRail } from '@/components/shared/entity-sheet-floating-rail';

interface DeliveryItemDetailSheetProps {
  item: DeliveryBoardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityUpdated: () => void;
  onTitleSaved: (item: DeliveryBoardItem) => void;
  /** When set (global Delivery Board), stage actions match board + server RBAC. */
  boardMutations?: UseDeliveryBoardMutationsResult;
  stageGateHighlight?: DeliverySheetStageGateHighlight | null;
}

function isActivePipelineStage(key: DeliveryPipelineClickKey): key is DeliveryActiveStage {
  return (ACTIVE_DELIVERY_STAGES as readonly string[]).includes(key);
}

function planningSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function DeliveryItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEntityUpdated,
  onTitleSaved,
  boardMutations,
  stageGateHighlight = null,
}: DeliveryItemDetailSheetProps) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [extension, setExtension] = useState<FullExtension | null>(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<DeliveryDetailTabId>('general');
  const [refreshKey, setRefreshKey] = useState(0);
  const [productPlan, setProductPlan] = useState<ProductPlanSnapshot | null>(null);
  const [productSnap, setProductSnap] = useState<ProductPlanSnapshot | null>(null);
  const [extensionPlan, setExtensionPlan] = useState<ExtensionPlanSnapshot | null>(null);
  const [extensionSnap, setExtensionSnap] = useState<ExtensionPlanSnapshot | null>(null);
  const [planningSaving, setPlanningSaving] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);

  const gateRequiredFields = useMemo(() => {
    if (!stageGateHighlight) return new Set<string>();
    const { fieldErrors, actionBlockers } = splitDeliveryStageGateErrors(stageGateHighlight.errors);
    return new Set([...fieldErrors, ...actionBlockers].map((error) => error.field));
  }, [stageGateHighlight]);

  const stageGateActionBlockers = useMemo(() => {
    if (!stageGateHighlight) return [];
    return splitDeliveryStageGateErrors(stageGateHighlight.errors).actionBlockers;
  }, [stageGateHighlight]);

  useEffect(() => {
    if (!open || !item) return;
    if (stageGateHighlight?.errors.length) {
      setPanel(resolveDeliveryDetailPanelFromErrors(stageGateHighlight.errors));
      return;
    }
    setPanel('general');
  }, [open, item, stageGateHighlight]);

  useEffect(() => {
    if (!open || !item) {
      setProduct(null);
      setExtension(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      try {
        if (item.kind === 'PRODUCT') {
          const data = await productsApi.getById(item.product.id);
          if (!cancelled) setProduct(data);
        } else {
          const data = await extensionsApi.getById(item.extension.id);
          if (!cancelled) setExtension(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, item, refreshKey]);

  useEffect(() => {
    if (!product) {
      setProductSnap(null);
      setProductPlan(null);
      return;
    }
    const snap = snapshotProductPlan(product);
    setProductSnap(snap);
    setProductPlan(snap);
  }, [product?.id, product?.updatedAt, product]);

  useEffect(() => {
    if (!extension) {
      setExtensionSnap(null);
      setExtensionPlan(null);
      return;
    }
    const snap = snapshotExtensionPlan(extension);
    setExtensionSnap(snap);
    setExtensionPlan(snap);
  }, [extension?.id, extension?.updatedAt, extension]);

  const refreshDetailOnly = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const refreshDetailAndBoard = useCallback(() => {
    refreshDetailOnly();
    onEntityUpdated();
  }, [onEntityUpdated, refreshDetailOnly]);

  const lifecycle = item ? mergeDeliveryDetailLifecycle(item, product, extension) : undefined;
  const displayTitle = product?.name ?? extension?.name ?? (item ? getItemLabel(item) : '');

  const headerProps =
    item && item.kind === 'PRODUCT'
      ? {
          entityKind: 'PRODUCT' as const,
          projectCode: item.product.project?.code ?? '—',
          projectName: item.product.project?.name ?? '—',
          projectHref: `/projects/${item.product.projectId}`,
          deadline: item.product.deadline,
          workSpaceHref: `/projects/${item.product.projectId}/products/${item.product.id}?tab=tasks`,
          sourcePageHref: `/projects/${item.product.projectId}/products/${item.product.id}`,
          productId: item.product.id,
        }
      : item && item.kind === 'EXTENSION'
        ? {
            entityKind: 'EXTENSION' as const,
            projectCode: item.extension.project?.code ?? '—',
            projectName: item.extension.project?.name ?? '—',
            projectHref: `/projects/${item.extension.projectId}`,
            deadline: null as string | null,
            workSpaceHref: `/projects/${item.extension.projectId}/products/${item.extension.productId}?tab=tasks`,
            sourcePageHref: `/projects/${item.extension.projectId}/products/${item.extension.productId}?tab=extensions`,
            productId: item.extension.productId,
          }
        : null;

  const panelProjectId =
    item?.kind === 'PRODUCT'
      ? item.product.projectId
      : item?.kind === 'EXTENSION'
        ? item.extension.projectId
        : '';
  const financeTabHref =
    headerProps && panelProjectId
      ? `/projects/${panelProjectId}/products/${headerProps.productId}?tab=finance`
      : '#';
  const projectHubHref = panelProjectId ? `/projects/${panelProjectId}` : '#';
  const credentialsTabHref =
    headerProps && panelProjectId
      ? `/projects/${panelProjectId}/products/${headerProps.productId}?tab=credentials`
      : '#';

  const handleCommitTitle = useCallback(
    async (trimmed: string) => {
      if (!item) return;
      if (item.kind === 'PRODUCT') {
        const updated = await productsApi.update(item.product.id, { name: trimmed });
        setProduct((current) =>
          current ? { ...current, name: updated.name, updatedAt: updated.updatedAt } : current,
        );
        onTitleSaved(productToDeliveryBoardItem(updated));
      } else {
        const updated = await extensionsApi.update(item.extension.id, { name: trimmed });
        setExtension((current) =>
          current ? { ...current, name: updated.name, updatedAt: updated.updatedAt } : current,
        );
        onTitleSaved(extensionToDeliveryBoardItem(updated));
      }
    },
    [item, onTitleSaved],
  );

  const handlePipelineSelect = useCallback(
    (key: DeliveryPipelineClickKey) => {
      if (!item || !boardMutations) return;
      if (key === DELIVERY_PIPELINE_DONE_KEY) {
        void boardMutations.handleBoardAction(item, 'COMPLETE');
        return;
      }
      if (key === DELIVERY_PIPELINE_CANCEL_KEY) {
        boardMutations.requestCancel(item);
        return;
      }
      if (isActivePipelineStage(key)) {
        void boardMutations.advanceToDeliveryStage(item, key);
      }
    },
    [item, boardMutations],
  );

  const busy = Boolean(item && boardMutations?.busyItemId === getItemId(item));

  const planningDirty = useMemo(() => {
    if (item?.kind === 'PRODUCT' && productSnap && productPlan) {
      return JSON.stringify(productSnap) !== JSON.stringify(productPlan);
    }
    if (item?.kind === 'EXTENSION' && extensionSnap && extensionPlan) {
      return JSON.stringify(extensionSnap) !== JSON.stringify(extensionPlan);
    }
    return false;
  }, [item?.kind, productSnap, productPlan, extensionSnap, extensionPlan]);

  const handlePlanningSave = useCallback(async () => {
    setPlanningError(null);
    if (item?.kind === 'PRODUCT' && product && productSnap && productPlan) {
      const patch = buildProductPlanPatch(productSnap, productPlan);
      if (!patch) return;
      setPlanningSaving(true);
      try {
        await productsApi.update(product.id, patch);
        refreshDetailOnly();
      } catch (err) {
        setPlanningError(planningSaveErrorMessage(err));
      } finally {
        setPlanningSaving(false);
      }
      return;
    }
    if (item?.kind === 'EXTENSION' && extension && extensionSnap && extensionPlan) {
      const patch = buildExtensionPlanPatch(extensionSnap, extensionPlan);
      if (!patch) return;
      setPlanningSaving(true);
      try {
        await extensionsApi.update(extension.id, patch);
        refreshDetailOnly();
      } catch (err) {
        setPlanningError(planningSaveErrorMessage(err));
      } finally {
        setPlanningSaving(false);
      }
    }
  }, [
    item?.kind,
    product,
    productSnap,
    productPlan,
    extension,
    extensionSnap,
    extensionPlan,
    refreshDetailOnly,
  ]);

  const handlePlanningCancel = useCallback(() => {
    setPlanningError(null);
    if (productSnap) setProductPlan(productSnap);
    if (extensionSnap) setExtensionPlan(extensionSnap);
  }, [productSnap, extensionSnap]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName="sm:right-[75vw]"
        floatingRail={
          headerProps ? (
            <EntitySheetFloatingRail
              sourcePageHref={headerProps.sourcePageHref}
              workspaceHref={headerProps.workSpaceHref}
            />
          ) : null
        }
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[75vw]"
      >
        {!item ? null : (
          <>
            <DeliveryItemDetailHeader
              title={displayTitle}
              entityKind={headerProps?.entityKind ?? 'PRODUCT'}
              workspaceHref={headerProps?.workSpaceHref ?? '#'}
              loading={loading}
              onCommitTitle={handleCommitTitle}
            />

            {lifecycle?.isTerminal ? (
              <div className="border-border bg-muted/40 shrink-0 border-b px-7 py-2.5">
                <p className="text-muted-foreground text-sm">
                  {lifecycle.resolution === 'DONE'
                    ? 'This delivery item is done. Details are read-only; use the board or product page for history.'
                    : 'This delivery item is cancelled. Details are read-only; use the board for audit history.'}
                </p>
              </div>
            ) : null}

            {lifecycle?.workStatus === 'ON_HOLD' && boardMutations && !lifecycle?.isTerminal ? (
              <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b bg-amber-50/60 px-7 py-2.5 dark:bg-amber-950/20">
                <p className="text-muted-foreground text-sm">Delivery is paused.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void boardMutations.handleBoardAction(item, 'RESUME')}
                >
                  Resume
                </Button>
              </div>
            ) : null}

            <div className="border-border shrink-0 border-b border-stone-100 dark:border-stone-800">
              <DeliveryPipelineStages
                lifecycle={lifecycle}
                disabled={busy || !boardMutations}
                onSelect={handlePipelineSelect}
              />
            </div>

            <DeliveryItemDetailTabBar panel={panel} onSelect={setPanel} />

            <ScrollArea className="min-h-0 flex-1">
              {loading ? (
                <div className="space-y-4 px-7 py-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : panel === 'general' && item && headerProps ? (
                <DeliveryItemDetailGeneralTab
                  item={item}
                  product={product}
                  extension={extension}
                  lifecycle={lifecycle}
                  workSpaceHref={headerProps.workSpaceHref}
                  sourcePageHref={headerProps.sourcePageHref}
                  credentialsTabHref={credentialsTabHref}
                  projectHubHref={projectHubHref}
                  financeTabHref={financeTabHref}
                  onRefreshDetail={refreshDetailAndBoard}
                  productPlan={productPlan}
                  onProductPlanChange={setProductPlan}
                  extensionPlan={extensionPlan}
                  onExtensionPlanChange={setExtensionPlan}
                  planningDisabled={planningSaving || Boolean(lifecycle?.isTerminal)}
                  gateRequiredFields={gateRequiredFields}
                  stageGateActionBlockers={stageGateActionBlockers}
                />
              ) : panel !== 'general' && !loading && headerProps && item ? (
                <DeliveryItemDetailSecondaryPanels
                  view={panel}
                  auditEntityType={item.kind === 'PRODUCT' ? 'PRODUCT' : 'EXTENSION'}
                  auditEntityId={item.kind === 'PRODUCT' ? item.product.id : item.extension.id}
                  financeTabHref={financeTabHref}
                  projectHubHref={projectHubHref}
                  workSpaceHref={headerProps.workSpaceHref}
                  bonusOrderId={product?.order?.id ?? extension?.order?.id ?? null}
                  openDealHref={
                    product?.order?.deal?.id != null
                      ? `/crm/deals?openDealId=${encodeURIComponent(product.order.deal.id)}`
                      : extension?.order?.deal?.id != null
                        ? `/crm/deals?openDealId=${encodeURIComponent(extension.order.deal.id)}`
                        : null
                  }
                  dealCode={product?.order?.deal?.code ?? extension?.order?.deal?.code ?? null}
                />
              ) : (
                <p className="text-muted-foreground px-7 py-6 text-sm">Could not load details.</p>
              )}
            </ScrollArea>

            <DetailSheetFormFooter
              visible={
                panel === 'general' &&
                !loading &&
                Boolean(product || extension) &&
                !lifecycle?.isTerminal
              }
              dirty={planningDirty}
              saving={planningSaving}
              errorMessage={planningError}
              onSave={() => void handlePlanningSave()}
              onCancel={handlePlanningCancel}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
