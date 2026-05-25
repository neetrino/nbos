import { BadRequestException } from '@nestjs/common';
import { type ExtensionStatusEnum } from '@nbos/database';
import {
  buildExtensionReadiness,
  getExtensionStageGateErrors,
  isExtensionTransitionAllowed,
  EXTENSION_ALLOWED_TRANSITIONS,
  EXTENSION_STAGE_GATE_VALIDATION_CODE,
  type ExtensionReadinessSummary,
} from '@nbos/shared';
import { attachExtensionDeliveryLifecycle } from '../delivery-lifecycle';

export const EXTENSION_STAGE_GATE_ERROR_CODE = EXTENSION_STAGE_GATE_VALIDATION_CODE;
export { EXTENSION_ALLOWED_TRANSITIONS };
export type { ExtensionReadinessSummary };

interface ExtensionForReadiness {
  status?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  order?: {
    id: string;
    status?: string | null;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
  tasks?: Array<{ status: string }>;
}

export function validateExtensionTransition(
  current: ExtensionStatusEnum,
  target: ExtensionStatusEnum,
) {
  if (isExtensionTransitionAllowed(current, target)) return;

  const allowed = EXTENSION_ALLOWED_TRANSITIONS[current];
  throw new BadRequestException(
    `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
  );
}

export function validateExtensionStageGate(
  extension: ExtensionForReadiness,
  target: ExtensionStatusEnum,
) {
  const errors = getExtensionStageGateErrors(extension, target);
  if (errors.length === 0) return;

  if (extension.status === 'NEW' && target === 'DEVELOPMENT') {
    throw new BadRequestException({
      statusCode: 400,
      code: EXTENSION_STAGE_GATE_ERROR_CODE,
      message: 'Cannot move extension to Development: missing required readiness items',
      errors,
    });
  }

  if (target === 'DONE') {
    throw new BadRequestException({
      statusCode: 400,
      code: EXTENSION_STAGE_GATE_ERROR_CODE,
      message: 'Cannot complete extension while delivery or finance blockers remain.',
      errors,
    });
  }
}

export function attachExtensionReadiness<T extends ExtensionForReadiness>(extension: T) {
  return {
    ...attachExtensionDeliveryLifecycle(extension),
    readiness: buildExtensionReadiness(extension),
  };
}
