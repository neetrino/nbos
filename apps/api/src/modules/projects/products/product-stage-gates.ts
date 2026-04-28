import { BadRequestException } from '@nestjs/common';
import { type ProductStatusEnum } from '@nbos/database';

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

export const PRODUCT_ALLOWED_TRANSITIONS: Record<ProductStatusEnum, ProductStatusEnum[]> = {
  NEW: ['CREATING', 'LOST'],
  CREATING: ['DEVELOPMENT', 'ON_HOLD', 'LOST'],
  DEVELOPMENT: ['QA', 'ON_HOLD', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'ON_HOLD', 'LOST'],
  TRANSFER: ['DONE', 'ON_HOLD', 'LOST'],
  ON_HOLD: ['CREATING', 'DEVELOPMENT', 'QA', 'TRANSFER', 'LOST'],
  DONE: [],
  LOST: [],
};

interface ProductForStageGate {
  status?: string | null;
  description?: string | null;
  deadline?: Date | string | null;
  order?: { id: string } | null;
}

interface KickoffChecklistItemForGate {
  key: string;
  title: string;
  isRequired: boolean;
  isChecked: boolean;
}

export function validateProductTransition(current: ProductStatusEnum, target: ProductStatusEnum) {
  const allowed = PRODUCT_ALLOWED_TRANSITIONS[current];

  if (!allowed?.includes(target)) {
    throw new BadRequestException(
      `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
    );
  }
}

export function validateProductStageGate(product: ProductForStageGate, target: ProductStatusEnum) {
  if (product.status !== 'NEW' || target !== 'CREATING') return;

  const missing: string[] = [];
  if (!product.description?.trim()) missing.push('description');
  if (!product.deadline) missing.push('deadline');
  if (!product.order?.id) missing.push('order');

  if (missing.length > 0) {
    throw new BadRequestException(
      `Cannot transition to CREATING: missing required fields ${missing.join(', ')}`,
    );
  }
}

export function validateKickoffChecklistGate(items: KickoffChecklistItemForGate[]) {
  const missing = items.filter((item) => item.isRequired && !item.isChecked);

  if (missing.length === 0) return;

  throw new BadRequestException({
    code: 'STAGE_GATE_VALIDATION',
    message: 'PM kickoff checklist must be accepted before Development.',
    errors: missing.map((item) => ({
      field: `kickoffChecklist.${item.key}`,
      message: item.title,
    })),
  });
}
