import { BadRequestException } from '@nestjs/common';
import { type ProductStatusEnum } from '@nbos/database';
import {
  getProductStageGateErrors,
  isProductTransitionAllowed,
  PRODUCT_ALLOWED_TRANSITIONS,
  STAGE_GATE_VALIDATION_CODE,
} from '@nbos/shared';

export { PRODUCT_ALLOWED_TRANSITIONS };

export const PRODUCT_STATUS_ORDER: ProductStatusEnum[] = [
  'NEW',
  'CREATING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
  'ON_HOLD',
  'DONE',
  'LOST',
];

interface ProductForStageGate {
  status?: string | null;
  description?: string | null;
  deadline?: Date | string | null;
  clientAcceptedAt?: Date | string | null;
  order?: { id: string; status?: string; invoices?: Array<{ moneyStatus: string }> } | null;
  extensions?: Array<{ status: string }>;
  tasks?: Array<{ status: string }>;
  tickets?: Array<{ status: string }>;
}

export function validateProductTransition(current: ProductStatusEnum, target: ProductStatusEnum) {
  if (isProductTransitionAllowed(current, target)) return;

  const allowed = PRODUCT_ALLOWED_TRANSITIONS[current];
  throw new BadRequestException(
    `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
  );
}

export function validateProductStageGate(product: ProductForStageGate, target: ProductStatusEnum) {
  const errors = getProductStageGateErrors(product, target);
  if (errors.length === 0) return;

  if (product.status === 'NEW' && target === 'CREATING') {
    const missing = errors.map((error) => error.field);
    throw new BadRequestException(
      `Cannot transition to CREATING: missing required fields ${missing.join(', ')}`,
    );
  }

  if (product.status === 'DEVELOPMENT' && target === 'QA') {
    throw new BadRequestException({
      statusCode: 400,
      code: STAGE_GATE_VALIDATION_CODE,
      message: 'Cannot move product to QA while execution tasks are still open.',
      errors,
    });
  }

  if (product.status === 'QA' && target === 'TRANSFER') {
    throw new BadRequestException({
      statusCode: 400,
      code: STAGE_GATE_VALIDATION_CODE,
      message: 'Cannot move product to Transfer while QA tasks are still open.',
      errors,
    });
  }

  if (target === 'DONE') {
    throw new BadRequestException({
      statusCode: 400,
      code: STAGE_GATE_VALIDATION_CODE,
      message: 'Cannot complete product while delivery items are still open.',
      errors,
    });
  }
}
