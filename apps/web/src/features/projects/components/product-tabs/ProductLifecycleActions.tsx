import { Pause, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FullProduct } from '@/lib/api/products';

interface ProductLifecycleActionsProps {
  product: FullProduct;
  disabled: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function ProductLifecycleActions({
  product,
  disabled,
  onPause,
  onResume,
  onCancel,
}: ProductLifecycleActionsProps) {
  const lifecycle = product.deliveryLifecycle;
  if (!lifecycle || lifecycle.isTerminal) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {lifecycle.workStatus === 'ON_HOLD' ? (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onResume}>
          <Play className="size-3.5" aria-hidden />
          Resume delivery
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={disabled} onClick={onPause}>
          <Pause className="size-3.5" aria-hidden />
          Pause delivery
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onCancel}
        className="border-red-300/70 bg-red-500/5 text-red-700 hover:bg-red-500/10 hover:text-red-800 dark:text-red-300"
      >
        <X className="size-3.5" aria-hidden />
        Cancel delivery
      </Button>
    </div>
  );
}
