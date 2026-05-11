import { Gift, History, Kanban, LayoutGrid, Phone } from 'lucide-react';
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
      <div className="flex gap-1">
        {DELIVERY_DETAIL_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const active = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                'relative flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors',
                active
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300',
              )}
            >
              <Icon size={16} aria-hidden />
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
