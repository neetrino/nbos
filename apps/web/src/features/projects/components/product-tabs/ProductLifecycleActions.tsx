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
    <div className="border-border mt-4 flex flex-wrap gap-2 border-t pt-4">
      {lifecycle.workStatus === 'ON_HOLD' ? (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onResume}>
          Resume delivery
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={disabled} onClick={onPause}>
          Pause delivery
        </Button>
      )}
      <Button variant="destructive" size="sm" disabled={disabled} onClick={onCancel}>
        Cancel delivery
      </Button>
    </div>
  );
}
