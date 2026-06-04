'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeliveryItemDetailSheet } from '@/features/projects/components/delivery-board/DeliveryItemDetailSheet';
import {
  getBoardItems,
  getItemKey,
  type DeliveryBoardItem,
} from '@/features/projects/components/delivery-board/project-delivery-board-model';
import { useDeliveryBoardMutations } from '@/features/projects/components/delivery-board/use-delivery-board-mutations';
import type { DeliverySheetStageGateHighlight } from '@/features/projects/components/delivery-board/delivery-stage-gate-highlight';
import { EntityDealSheetDeepLink } from '@/features/projects/components/EntityDealSheetDeepLink';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import type { FullProject } from '@/lib/api/projects';
import type { FullProduct } from '@/lib/api/products';

interface EntityDetailSheetsHostProps {
  project?: FullProject | null;
  product?: FullProduct | null;
  onEntityUpdated: () => void;
}

function boardItemsForProduct(product: FullProduct): DeliveryBoardItem[] {
  const projectMeta = {
    id: product.project.id,
    name: product.project.name,
    code: product.project.code,
  };
  const productItem: DeliveryBoardItem = {
    kind: 'PRODUCT',
    product: {
      id: product.id,
      name: product.name,
      status: product.status,
      productCategory: product.productCategory,
      productType: product.productType,
      deadline: product.deadline,
      description: product.description,
      order: product.order,
      pm: product.pm,
      deliveryLifecycle: product.deliveryLifecycle,
      projectId: product.projectId,
      project: projectMeta,
      _count: product._count,
    },
  };
  const extensionItems: DeliveryBoardItem[] = product.extensions.map((extension) => ({
    kind: 'EXTENSION',
    extension: {
      id: extension.id,
      name: extension.name,
      status: extension.status,
      size: extension.size,
      productId: product.id,
      projectId: product.projectId,
      assignee: extension.assignee,
      order: extension.order ?? null,
      product: {
        id: product.id,
        name: product.name,
        productType: product.productType,
        status: product.status,
      },
      project: projectMeta,
      _count: { tasks: 0 },
    },
  }));
  return [productItem, ...extensionItems];
}

function resolveDeliveryItems(
  project: FullProject | null | undefined,
  product: FullProduct | null | undefined,
): DeliveryBoardItem[] {
  if (project) return getBoardItems(project);
  if (product) return boardItemsForProduct(product);
  return [];
}

export function EntityDetailSheetsHost({
  project,
  product,
  onEntityUpdated,
}: EntityDetailSheetsHostProps) {
  const { openDeliveryItemKey, openDealId, closeDeliveryItem, closeDeal } =
    useEntityDetailSheetUrl();

  const deliveryItems = useMemo(() => resolveDeliveryItems(project, product), [project, product]);

  const detailItem = useMemo(() => {
    if (!openDeliveryItemKey) return null;
    return deliveryItems.find((item) => getItemKey(item) === openDeliveryItemKey) ?? null;
  }, [openDeliveryItemKey, deliveryItems]);

  const [stageGateHighlight, setStageGateHighlight] =
    useState<DeliverySheetStageGateHighlight | null>(null);

  const handleDetailItemRenamed = useCallback(
    (_updated: DeliveryBoardItem) => {
      onEntityUpdated();
    },
    [onEntityUpdated],
  );

  const deliveryMutations = useDeliveryBoardMutations(onEntityUpdated, {
    onStageGateBlocked: (_item, _target, errors) => setStageGateHighlight({ errors }),
    onStageGateClear: () => setStageGateHighlight(null),
  });

  useEffect(() => {
    if (!openDeliveryItemKey) return;
    const exists = deliveryItems.some((item) => getItemKey(item) === openDeliveryItemKey);
    if (!exists) closeDeliveryItem();
  }, [openDeliveryItemKey, deliveryItems, closeDeliveryItem]);

  return (
    <>
      <DeliveryItemDetailSheet
        item={detailItem}
        open={Boolean(detailItem)}
        onOpenChange={(next) => {
          if (!next) {
            setStageGateHighlight(null);
            closeDeliveryItem();
          }
        }}
        onEntityUpdated={onEntityUpdated}
        onTitleSaved={handleDetailItemRenamed}
        boardMutations={deliveryMutations}
        stageGateHighlight={stageGateHighlight}
      />
      <EntityDealSheetDeepLink
        dealId={openDealId}
        open={Boolean(openDealId)}
        onOpenChange={(next) => {
          if (!next) closeDeal();
        }}
      />
    </>
  );
}
