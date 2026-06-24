'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { orderLifecycleAction } from '@/features/finance/utils/order-lifecycle';
import { getApiErrorMessage } from '@/lib/api-errors';
import { ordersApi, type Order } from '@/lib/api/finance';
import { toast } from 'sonner';

interface OrderLifecycleConfirmDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (order: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
}

export function OrderLifecycleConfirmDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
  onOrderDeleted,
}: OrderLifecycleConfirmDialogProps) {
  const action = orderLifecycleAction(order);
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
        onOpenChange(false);
        toast.success('Order deleted');
      } else {
        const updated = await ordersApi.close(order.id);
        onOrderUpdated(updated);
        onOpenChange(false);
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
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError(null);
      }}
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
      forceNestedBackdrop
      onConfirm={() => void handleConfirm()}
    />
  );
}
