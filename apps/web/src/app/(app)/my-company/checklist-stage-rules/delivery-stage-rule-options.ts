import type { DeliveryChecklistTarget, DeliveryStageCanon } from '@/lib/api/checklist-templates';

export const FILTER_ANY = '__any__' as const;

export const DELIVERY_STAGES: { value: DeliveryStageCanon; label: string }[] = [
  { value: 'STARTING', label: 'Starting' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'QA', label: 'QA' },
  { value: 'TRANSFER', label: 'Transfer' },
];

export const TARGETS: { value: DeliveryChecklistTarget; label: string }[] = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'EXTENSION', label: 'Extension' },
];

export const SELECT_TRIGGER_FORM = 'w-full min-w-0';
