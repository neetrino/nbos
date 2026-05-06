import { BadRequestException } from '@nestjs/common';
import { type ExtensionStatusEnum } from '@nbos/database';
import { attachExtensionDeliveryLifecycle } from '../delivery-lifecycle';

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
  order?: { id: string; status?: string | null; invoices?: Array<{ status: string }> } | null;
  tasks?: Array<{ status: string }>;
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
  if (extension.status === 'NEW' && target === 'DEVELOPMENT') {
    validateExtensionDevelopmentGate(extension);
  }

  if (target === 'DONE') {
    validateExtensionDoneGate(extension);
  }
}

function validateExtensionDevelopmentGate(extension: ExtensionForReadiness) {
  const missing = buildExtensionReadiness(extension).missing;
  if (missing.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: EXTENSION_STAGE_GATE_ERROR_CODE,
    message: 'Cannot move extension to Development: missing required readiness items',
    errors: missing,
  });
}

function validateExtensionDoneGate(extension: ExtensionForReadiness) {
  const openTaskCount = (extension.tasks ?? []).filter((task) => !isClosedTask(task.status)).length;
  const errors: ExtensionReadinessIssue[] = [];
  if (openTaskCount > 0) {
    errors.push({
      field: 'tasks',
      message: `${openTaskCount} tasks still require completion before Extension Done.`,
    });
  }
  errors.push(...buildOpenOrderError(extension.order));
  errors.push(...buildUnpaidInvoiceError(extension.order?.invoices ?? []));
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: EXTENSION_STAGE_GATE_ERROR_CODE,
    message: 'Cannot complete extension while delivery or finance blockers remain.',
    errors,
  });
}

function isClosedTask(status: string) {
  return ['COMPLETED', 'DONE', 'DEFERRED', 'CANCELLED'].includes(status);
}

function buildOpenOrderError(order: ExtensionForReadiness['order']): ExtensionReadinessIssue[] {
  if (!order?.status || ['FULLY_PAID', 'CLOSED'].includes(order.status)) return [];
  return [
    {
      field: 'finance',
      message: `Order ${order.status} must be fully paid or closed before Extension Done.`,
    },
  ];
}

function buildUnpaidInvoiceError(invoices: Array<{ status: string }>): ExtensionReadinessIssue[] {
  const unpaidCount = invoices.filter((invoice) => invoice.status !== 'PAID').length;
  if (unpaidCount === 0) return [];
  return [
    {
      field: 'finance',
      message: `${unpaidCount} invoices still require payment before Extension Done.`,
    },
  ];
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
  return {
    ...attachExtensionDeliveryLifecycle(extension),
    readiness: buildExtensionReadiness(extension),
  };
}
