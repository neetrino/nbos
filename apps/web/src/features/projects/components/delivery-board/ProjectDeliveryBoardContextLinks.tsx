import { ListChecks, Puzzle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNavigableProductId, type DeliveryBoardItem } from './project-delivery-board-model';

export type ProductBoardTab = 'tasks' | 'tickets' | 'extensions';

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
        label={`${item.product._count.tasks} tasks`}
        onClick={() => onOpenProductTab(productId, 'tasks')}
      />
      <ContextLink
        icon={Ticket}
        label={`${item.product._count.tickets} tickets`}
        onClick={() => onOpenProductTab(productId, 'tickets')}
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
        label={`${item.extension._count.tasks} tasks`}
        onClick={() => onOpenProductTab(productId, 'tasks')}
      />
      <ContextLink
        icon={Puzzle}
        label="Open extension"
        onClick={() => onOpenProductTab(productId, 'extensions')}
      />
    </>
  );
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
    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onClick}>
      <Icon size={12} />
      {label}
    </Button>
  );
}
