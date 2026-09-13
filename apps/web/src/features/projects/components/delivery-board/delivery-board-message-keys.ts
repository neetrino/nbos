import { isDeliveryHoldExpired } from '@/features/projects/constants/projects';
import { DELIVERY_STAGE_LABELS } from './project-delivery-board-model';
import { PRODUCT_LANGUAGE_OPTIONS } from './delivery-product-language-options';
import { STAGE_READINESS_LABELS } from './delivery-stage-readiness-rows';

export const DELIVERY_STAGE_MESSAGE_KEYS = {
  STARTING: 'stages.STARTING',
  DEVELOPMENT: 'stages.DEVELOPMENT',
  QA: 'stages.QA',
  TRANSFER: 'stages.TRANSFER',
} as const satisfies Record<keyof typeof DELIVERY_STAGE_LABELS, string>;

export const DELIVERY_PIPELINE_SHORT_MESSAGE_KEYS = {
  STARTING: 'pipeline.start',
  DEVELOPMENT: 'pipeline.dev',
  QA: 'pipeline.qa',
  TRANSFER: 'pipeline.transfer',
} as const satisfies Record<keyof typeof DELIVERY_STAGE_LABELS, string>;

export const PRODUCT_LANGUAGE_MESSAGE_KEYS = {
  hy: 'languages.hy',
  en: 'languages.en',
  ru: 'languages.ru',
  de: 'languages.de',
  fr: 'languages.fr',
  es: 'languages.es',
  it: 'languages.it',
  ar: 'languages.ar',
  tr: 'languages.tr',
  zh: 'languages.zh',
  ja: 'languages.ja',
  ko: 'languages.ko',
} as const;

export const READINESS_LABEL_MESSAGE_KEYS = {
  [STAGE_READINESS_LABELS.deadlineSet]: 'readiness.deadlineSet',
  [STAGE_READINESS_LABELS.noOpenWorkSpaceTasks]: 'readiness.noOpenWorkSpaceTasks',
  [STAGE_READINESS_LABELS.noOpenExtensions]: 'readiness.noOpenExtensions',
  [STAGE_READINESS_LABELS.noOpenTasks]: 'readiness.noOpenTasks',
  [STAGE_READINESS_LABELS.noOpenTickets]: 'readiness.noOpenTickets',
  [STAGE_READINESS_LABELS.clientAcceptance]: 'readiness.clientAcceptance',
  [STAGE_READINESS_LABELS.orderClosed]: 'readiness.orderClosed',
  [STAGE_READINESS_LABELS.noUnpaidInvoices]: 'readiness.noUnpaidInvoices',
  [STAGE_READINESS_LABELS.scopeFilled]: 'readiness.scopeFilled',
  [STAGE_READINESS_LABELS.ownerAssigned]: 'readiness.ownerAssigned',
  [STAGE_READINESS_LABELS.stageChecklist]: 'readiness.stageChecklist',
} as const;

import type { useTranslations } from 'next-intl';

export type DeliveryBoardTranslate = ReturnType<typeof useTranslations<'deliveryBoard'>>;

function deliveryBoardMessage(
  t: DeliveryBoardTranslate,
  key: string,
  values?: Record<string, string | number>,
): string {
  return t(key as never, values as never);
}

export function deliveryStageMessageKey(
  stage: string | null | undefined,
): (typeof DELIVERY_STAGE_MESSAGE_KEYS)[keyof typeof DELIVERY_STAGE_MESSAGE_KEYS] | null {
  if (!stage || !(stage in DELIVERY_STAGE_MESSAGE_KEYS)) return null;
  return DELIVERY_STAGE_MESSAGE_KEYS[stage as keyof typeof DELIVERY_STAGE_MESSAGE_KEYS];
}

export function productLanguageMessageKey(
  code: string,
): (typeof PRODUCT_LANGUAGE_MESSAGE_KEYS)[keyof typeof PRODUCT_LANGUAGE_MESSAGE_KEYS] | null {
  const normalized = code.trim().toLowerCase();
  if (!(normalized in PRODUCT_LANGUAGE_MESSAGE_KEYS)) return null;
  return PRODUCT_LANGUAGE_MESSAGE_KEYS[normalized as keyof typeof PRODUCT_LANGUAGE_MESSAGE_KEYS];
}

export function translateProductLanguageName(
  code: string,
  t: DeliveryBoardTranslate,
  fallback: string,
): string {
  const key = productLanguageMessageKey(code);
  return key ? t(key) : fallback;
}

export function translateReadinessLabel(label: string, t: DeliveryBoardTranslate): string {
  if (label in READINESS_LABEL_MESSAGE_KEYS) {
    return t(READINESS_LABEL_MESSAGE_KEYS[label as keyof typeof READINESS_LABEL_MESSAGE_KEYS]);
  }
  return label;
}

export function translateReadinessDetail(
  rowKey: string,
  checklist:
    | {
        completedChecklists?: number | null;
        totalChecklists?: number | null;
        completed: number;
        total: number;
      }
    | null
    | undefined,
  t: DeliveryBoardTranslate,
  fallback?: string,
): string | undefined {
  if (rowKey !== 'checklist' || !checklist) return fallback;
  const completedChecklists = checklist.completedChecklists ?? 0;
  const totalChecklists = checklist.totalChecklists ?? 0;
  if (totalChecklists > 0) {
    return t('readiness.checklistDetailFull', {
      completedChecklists,
      totalChecklists,
      reviewed: checklist.completed,
      total: checklist.total,
    });
  }
  return t('readiness.checklistDetailReviewed', {
    reviewed: checklist.completed,
    total: checklist.total,
  });
}

export function translateClosedDeadlineLabel(label: string, t: DeliveryBoardTranslate): string {
  if (label === 'On time') return t('deadline.onTime');
  if (label === 'Late') return t('deadline.late');
  return label;
}

export function translateDeliveryLifecycleLabel(
  lifecycle: {
    stage: string | null;
    workStatus: string;
    resolution: string | null;
    onHoldUntil?: string | null;
  },
  t: DeliveryBoardTranslate,
): string {
  if (lifecycle.resolution === 'DONE') return t('resolution.done');
  if (lifecycle.resolution === 'CANCELLED') return t('resolution.cancelled');
  const stageKey = deliveryStageMessageKey(lifecycle.stage);
  const stageLabel = stageKey ? t(stageKey) : lifecycle.stage;
  if (isDeliveryHoldExpired(lifecycle)) {
    return stageLabel
      ? t('lifecycle.stageHoldExpired', { stage: stageLabel })
      : t('lifecycle.holdExpired');
  }
  if (lifecycle.workStatus === 'ON_HOLD') {
    return stageLabel ? t('lifecycle.stageOnHold', { stage: stageLabel }) : t('lifecycle.onHold');
  }
  return stageLabel ?? t('lifecycle.notStaged');
}

export const PRODUCT_LANGUAGE_CODES = PRODUCT_LANGUAGE_OPTIONS.map((option) => option.value);
