/**
 * Task statuses treated as "closed" for product stage gates — mirrors
 * product-stage-gates buildOpenItemError lists plus canonical COMPLETED.
 */
export { PRODUCT_GATE_CLOSED_TASK_STATUSES } from '@nbos/shared';

/** Extension done gate — extension-stage-gates isClosedTask */
export const EXTENSION_GATE_CLOSED_TASK_STATUSES = ['COMPLETED', 'ON_HOLD'] as const;
