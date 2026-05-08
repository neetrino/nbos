'use client';

import type { FullProject } from '@/lib/api/projects';
import { DeliveryBoardView } from './delivery-board/DeliveryBoardView';
import { getBoardItems } from './delivery-board/project-delivery-board-model';
import type { ProductBoardTab } from './delivery-board/ProjectDeliveryBoardContextLinks';
import { useDeliveryBoardMutations } from './delivery-board/use-delivery-board-mutations';

interface ProjectDeliveryBoardProps {
  project: FullProject;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onRefresh: () => void | Promise<void>;
}

export function ProjectDeliveryBoard({
  project,
  onOpenProduct,
  onOpenProductTab,
  onRefresh,
}: ProjectDeliveryBoardProps) {
  const mutations = useDeliveryBoardMutations(onRefresh);
  return (
    <DeliveryBoardView
      items={getBoardItems(project)}
      mutations={mutations}
      onOpenProduct={onOpenProduct}
      onOpenProductTab={onOpenProductTab}
      includeClosedBoardSection
    />
  );
}
