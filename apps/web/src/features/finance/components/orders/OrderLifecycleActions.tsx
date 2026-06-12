'use client';

import { useState } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared';
import { orderLifecycleAction } from '@/features/finance/utils/order-lifecycle';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ordersApi, type Order } from '@/lib/api/finance';
import { toast } from 'sonner';

interface OrderLifecycleActionsProps {
  order: Order;
  onOrderUpdated: (order: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
}

export function OrderLifecycleActions({
  order,
  onOrderUpdated,
  onOrderDeleted,
}: OrderLifecycleActionsProps) {
  const action = orderLifecycleAction(order);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  const isDelete = action === 'delete';

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (isDelete) {
        await ordersApi.delete(order.id);
        onOrderDeleted?.(order.id);
        setOpen(false);
        toast.success('Order deleted');
      } else {
        const updated = await ordersApi.close(order.id);
        onOrderUpdated(updated);
        setOpen(false);
        toast.success('Order closed');
      }
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          isDelete ? 'Order could not be deleted.' : 'Order could not be closed.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10 border-destructive/40"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {isDelete ? <Trash2 size={14} aria-hidden /> : <Archive size={14} aria-hidden />}
        {isDelete ? 'Delete order' : 'Close order'}
      </Button>

      <DeleteConfirmDialog
        level="simple"
        open={open}
        onOpenChange={setOpen}
        itemName={order.code}
        title={isDelete ? 'Delete draft order?' : 'Close order?'}
        description={
          isDelete
            ? 'Only PENDING_PAYMENT orders without invoices can be deleted.'
            : 'The order will move to Closed and stay in history with linked invoices.'
        }
        confirmLabel={isDelete ? 'Delete' : 'Close order'}
        isSubmitting={submitting}
        errorMessage={error}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
