import { Gift, History, Kanban, LayoutGrid, Phone } from 'lucide-react';
import {
  DETAIL_SHEET_TAB_ACTIVE_CLASS,
  DETAIL_SHEET_TAB_BAR_SCROLL_CLASS,
  DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
  DETAIL_SHEET_TAB_INACTIVE_CLASS,
  DETAIL_SHEET_TAB_INDICATOR_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { DELIVERY_DETAIL_TABS, type DeliveryDetailTabId } from './delivery-item-detail.constants';

const TAB_ICONS: Record<DeliveryDetailTabId, typeof LayoutGrid> = {
  general: LayoutGrid,
  workspace: Kanban,
  calls: Phone,
  bonus: Gift,
  history: History,
};

interface DeliveryItemDetailTabBarProps {
  panel: DeliveryDetailTabId;
  onSelect: (id: DeliveryDetailTabId) => void;
}

export function DeliveryItemDetailTabBar({ panel, onSelect }: DeliveryItemDetailTabBarProps) {
  return (
    <div className="shrink-0 border-b border-stone-100 px-5 dark:border-stone-800">
      <div className={DETAIL_SHEET_TAB_BAR_SCROLL_CLASS}>
        {DELIVERY_DETAIL_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const active = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                DETAIL_SHEET_TAB_BUTTON_BASE_CLASS,
                active ? DETAIL_SHEET_TAB_ACTIVE_CLASS : DETAIL_SHEET_TAB_INACTIVE_CLASS,
              )}
            >
              <Icon size={16} aria-hidden />
              {tab.label}
              {active ? <span className={DETAIL_SHEET_TAB_INDICATOR_CLASS} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
