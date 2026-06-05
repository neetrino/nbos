import { ListChecks, Puzzle, Ticket } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { tasksApi } from '@/lib/api/tasks';
import { getNavigableProductId, type DeliveryBoardItem } from './project-delivery-board-model';

export type ProductBoardTab = 'tasks' | 'support' | 'extensions';

interface ProjectDeliveryBoardContextLinksProps {
  item: DeliveryBoardItem;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
}

export function ProjectDeliveryBoardContextLinks({
  item,
  onOpenProductTab,
}: ProjectDeliveryBoardContextLinksProps) {
  const productId = getNavigableProductId(item);
  if (!productId) return null;

  return (
    <div className="border-border mt-3 flex flex-wrap gap-1.5 border-t pt-2">
      {item.kind === 'PRODUCT' ? (
        <ProductContextLinks
          item={item}
          productId={productId}
          onOpenProductTab={onOpenProductTab}
        />
      ) : (
        <ExtensionContextLinks
          item={item}
          productId={productId}
          onOpenProductTab={onOpenProductTab}
        />
      )}
    </div>
  );
}

function ProductContextLinks({
  item,
  productId,
  onOpenProductTab,
}: {
  item: Extract<DeliveryBoardItem, { kind: 'PRODUCT' }>;
  productId: string;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
}) {
  return (
    <>
      <ContextLink
        icon={ListChecks}
        label={`${item.product._count.tasks} Work Space`}
        onClick={() => onOpenProductTab(productId, 'tasks')}
      />
      <ContextLink
        icon={Ticket}
        label={`${item.product._count.tickets} tickets`}
        onClick={() => onOpenProductTab(productId, 'support')}
      />
      <ContextLink
        icon={Puzzle}
        label={`${item.product._count.extensions} ext.`}
        onClick={() => onOpenProductTab(productId, 'extensions')}
      />
    </>
  );
}

function ExtensionContextLinks({
  item,
  productId,
  onOpenProductTab,
}: {
  item: Extract<DeliveryBoardItem, { kind: 'EXTENSION' }>;
  productId: string;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
}) {
  return (
    <>
      <ContextLink
        icon={ListChecks}
        label={`${item.extension._count.tasks} Product Work Space`}
        onClick={() => openProductWorkSpace(productId, onOpenProductTab)}
      />
      <ContextLink
        icon={Puzzle}
        label="Open extension"
        onClick={() => onOpenProductTab(productId, 'extensions')}
      />
    </>
  );
}

function openProductWorkSpace(
  productId: string,
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void,
) {
  void tasksApi.ensureProductWorkSpace(productId).finally(() => {
    onOpenProductTab(productId, 'tasks');
  });
}

function ContextLink({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ListChecks;
  label: string;
  onClick: () => void;
}) {
  return (
    <ActionTileButton
      label={label}
      icon={<Icon aria-hidden />}
      tone="neutral"
      size="card"
      onClick={onClick}
    />
  );
}
