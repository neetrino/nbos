import { Gift, History, LayoutGrid, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DELIVERY_DETAIL_TABS, type DeliveryDetailTabId } from './delivery-item-detail.constants';

const TAB_ICONS: Record<DeliveryDetailTabId, typeof LayoutGrid> = {
  general: LayoutGrid,
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
    <div className="border-border shrink-0 border-b px-5 sm:px-7 dark:border-stone-800">
      <div className="flex flex-wrap gap-1">
        {DELIVERY_DETAIL_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const active = panel === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={cn(
                'relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/35 dark:text-sky-200'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon size={16} className="opacity-80" aria-hidden />
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-sky-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
