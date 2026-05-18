/**
 * Task statuses treated as "closed" for product stage gates — mirrors
 * product-stage-gates buildOpenItemError lists plus canonical COMPLETED.
 */
export const PRODUCT_GATE_CLOSED_TASK_STATUSES = ['ON_HOLD', 'COMPLETED'] as const;

/** Extension done gate — extension-stage-gates isClosedTask */
export const EXTENSION_GATE_CLOSED_TASK_STATUSES = ['COMPLETED', 'ON_HOLD'] as const;
