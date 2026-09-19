import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { CatalogFunctionIcon } from './catalog-icon';

type FunctionCatalogCardProps = {
  item: DeliveryFunctionOperationalDto;
  statusLabel: string;
  showStatus: boolean;
  onOpen: (id: string) => void;
};

export function FunctionCatalogCard({
  item,
  statusLabel,
  showStatus,
  onOpen,
}: FunctionCatalogCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="border-border bg-card hover:bg-muted/40 flex h-full flex-col gap-2 rounded-2xl border p-4 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="bg-muted flex size-10 items-center justify-center rounded-xl">
          <CatalogFunctionIcon iconKey={item.iconKey} />
        </span>
        {showStatus ? <span className="text-muted-foreground text-xs">{statusLabel}</span> : null}
      </div>
      <p className="text-foreground text-sm font-semibold">{item.title}</p>
      <p className="text-muted-foreground line-clamp-2 text-xs">{item.summary}</p>
      <p className="text-muted-foreground text-xs">{item.category}</p>
    </button>
  );
}
