/**
 * Task statuses treated as "closed" for product stage gates — mirrors
 * product-stage-gates buildOpenItemError lists plus canonical COMPLETED.
 */
export const PRODUCT_GATE_CLOSED_TASK_STATUSES = [
  'DONE',
  'DEFERRED',
  'CANCELLED',
  'COMPLETED',
] as const;

/** Extension done gate — extension-stage-gates isClosedTask */
export const EXTENSION_GATE_CLOSED_TASK_STATUSES = [
  'COMPLETED',
  'DONE',
  'DEFERRED',
  'CANCELLED',
] as const;
