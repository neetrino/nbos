import { Gift, History, Kanban, LayoutGrid, Phone } from 'lucide-react';
import { DetailSheetTabBar } from '@/components/shared/DetailSheetTabBar';
import { DELIVERY_DETAIL_TABS, type DeliveryDetailTabId } from './delivery-item-detail.constants';

const TAB_ICONS = {
  general: LayoutGrid,
  workspace: Kanban,
  calls: Phone,
  bonus: Gift,
  history: History,
} as const;

const DELIVERY_DETAIL_TAB_ITEMS = DELIVERY_DETAIL_TABS.map((tab) => ({
  value: tab.id,
  label: tab.label,
  icon: TAB_ICONS[tab.id],
}));

interface DeliveryItemDetailTabBarProps {
  panel: DeliveryDetailTabId;
  onSelect: (id: DeliveryDetailTabId) => void;
}

export function DeliveryItemDetailTabBar({ panel, onSelect }: DeliveryItemDetailTabBarProps) {
  return (
    <DetailSheetTabBar
      tabs={DELIVERY_DETAIL_TAB_ITEMS}
      activeTab={panel}
      onTabChange={(value) => onSelect(value as DeliveryDetailTabId)}
    />
  );
}
