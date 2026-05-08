import { cn } from '@/lib/utils';
import {
  DELIVERY_DETAIL_SECONDARY_TABS,
  type DeliveryDetailPanel,
  type DeliveryDetailSecondaryId,
} from './delivery-item-detail.constants';

interface DeliveryItemDetailTabBarProps {
  panel: DeliveryDetailPanel;
  onSelectSecondary: (id: DeliveryDetailSecondaryId) => void;
}

export function DeliveryItemDetailTabBar({
  panel,
  onSelectSecondary,
}: DeliveryItemDetailTabBarProps) {
  return (
    <div className="border-border shrink-0 border-b px-5 sm:px-7 dark:border-stone-800">
      <div className="flex flex-wrap gap-1">
        {DELIVERY_DETAIL_SECONDARY_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            active={panel === tab.id}
            onClick={() => onSelectSecondary(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {label}
      {active ? (
        <span className="bg-primary absolute inset-x-2 bottom-0 h-0.5 rounded-full" />
      ) : null}
    </button>
  );
}
