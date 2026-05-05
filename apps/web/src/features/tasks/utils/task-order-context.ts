import type { Task } from '@/lib/api/tasks';

export interface TaskOrderContext {
  orderCode: string;
  scopeLabel: string;
}

/**
 * Derives commercial Order context for UI (product / extension / work space).
 */
export function resolveTaskOrderContext(task: Task): TaskOrderContext | null {
  if (task.product?.order) {
    return { orderCode: task.product.order.code, scopeLabel: task.product.name };
  }
  if (task.extension?.order) {
    return {
      orderCode: task.extension.order.code,
      scopeLabel: `${task.extension.name} · ${task.extension.product.name}`,
    };
  }
  const ws = task.workspace;
  if (ws?.product?.order) {
    return { orderCode: ws.product.order.code, scopeLabel: `WS · ${ws.product.name}` };
  }
  if (ws?.extension?.order) {
    return {
      orderCode: ws.extension.order.code,
      scopeLabel: `WS · ${ws.extension.name}`,
    };
  }
  if (task.links.some((l) => l.entityType === 'ORDER')) {
    return { orderCode: '—', scopeLabel: 'Order (see links)' };
  }
  return null;
}
