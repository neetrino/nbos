import { DetailSheetTabBar, type DetailSheetTabItem } from '@/components/shared/DetailSheetTabBar';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';

interface DeliveryItemDetailTabBarProps {
  tabs: readonly DetailSheetTabItem[];
  panel: DeliveryDetailTabId;
  onSelect: (id: DeliveryDetailTabId) => void;
}

export function DeliveryItemDetailTabBar({ tabs, panel, onSelect }: DeliveryItemDetailTabBarProps) {
  return (
    <DetailSheetTabBar
      tabs={tabs}
      activeTab={panel}
      onTabChange={(value) => onSelect(value as DeliveryDetailTabId)}
    />
  );
}
