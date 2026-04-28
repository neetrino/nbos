import { BadRequestException } from '@nestjs/common';
import { type ExtensionStatusEnum } from '@nbos/database';

export const EXTENSION_STAGE_GATE_ERROR_CODE = 'EXTENSION_STAGE_GATE_VALIDATION';

export const EXTENSION_ALLOWED_TRANSITIONS: Record<ExtensionStatusEnum, ExtensionStatusEnum[]> = {
  NEW: ['DEVELOPMENT', 'LOST'],
  DEVELOPMENT: ['QA', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'LOST'],
  TRANSFER: ['DONE', 'LOST'],
  DONE: [],
  LOST: [],
};

interface ExtensionForReadiness {
  status?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  order?: { id: string } | null;
}

export interface ExtensionReadinessIssue {
  field: string;
  message: string;
}

export interface ExtensionReadinessSummary {
  isReadyForDevelopment: boolean;
  missing: ExtensionReadinessIssue[];
}

export function validateExtensionTransition(
  current: ExtensionStatusEnum,
  target: ExtensionStatusEnum,
) {
  const allowed = EXTENSION_ALLOWED_TRANSITIONS[current];
  if (allowed?.includes(target)) return;

  throw new BadRequestException(
    `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
  );
}

export function validateExtensionStageGate(
  extension: ExtensionForReadiness,
  target: ExtensionStatusEnum,
) {
  if (extension.status !== 'NEW' || target !== 'DEVELOPMENT') return;

  const missing = buildExtensionReadiness(extension).missing;
  if (missing.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: EXTENSION_STAGE_GATE_ERROR_CODE,
    message: 'Cannot move extension to Development: missing required readiness items',
    errors: missing,
  });
}

export function buildExtensionReadiness(
  extension: ExtensionForReadiness,
): ExtensionReadinessSummary {
  const missing: ExtensionReadinessIssue[] = [];
  if (extension.status !== 'NEW') return { isReadyForDevelopment: true, missing };

  if (!extension.description?.trim()) {
    missing.push({ field: 'description', message: 'Description is required before Development' });
  }
  if (!extension.assignedTo) {
    missing.push({ field: 'assignedTo', message: 'Assignee is required before Development' });
  }
  if (!extension.order?.id) {
    missing.push({ field: 'order', message: 'Linked order is required before Development' });
  }

  return { isReadyForDevelopment: missing.length === 0, missing };
}

export function attachExtensionReadiness<T extends ExtensionForReadiness>(extension: T) {
  return { ...extension, readiness: buildExtensionReadiness(extension) };
}
