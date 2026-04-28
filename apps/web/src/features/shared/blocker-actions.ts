import type { ApiFieldError } from '@/lib/api-errors';

export interface BlockerDirectAction {
  key: string;
  label: string;
  target: 'details' | 'finance' | 'project';
}

interface ResolveBlockerActionsArgs {
  context: 'crm' | 'product' | 'extension';
  errors: ApiFieldError[];
}

const CRM_ACTION_RULES = [
  {
    key: 'attribution',
    label: 'Open attribution fields',
    target: 'details',
    fields: ['source', 'sourceDetail', 'sourcePartnerId', 'sourceContactId', 'whichOne'],
  },
  {
    key: 'offer',
    label: 'Open offer details',
    target: 'details',
    fields: [
      'amount',
      'paymentType',
      'productCategory',
      'productType',
      'offerSentAt',
      'offerProof',
    ],
  },
  {
    key: 'contract',
    label: 'Open contract details',
    target: 'details',
    fields: [
      'responseDueAt',
      'companyId',
      'contractProof',
      'pmId',
      'deadline',
      'existingProductId',
    ],
  },
  {
    key: 'finance',
    label: 'Open deal finance',
    target: 'finance',
    fields: ['invoice', 'payment'],
  },
] as const;

const PRODUCT_ACTION_RULES = [
  {
    key: 'pm-intake',
    label: 'Open PM intake',
    target: 'project',
    fields: ['kickoffChecklist', 'description', 'deadline', 'order'],
  },
] as const;

const EXTENSION_ACTION_RULES = [
  {
    key: 'extension-readiness',
    label: 'Open extension context',
    target: 'project',
    fields: ['description', 'assignedTo', 'order'],
  },
] as const;

export function resolveBlockerDirectActions({
  context,
  errors,
}: ResolveBlockerActionsArgs): BlockerDirectAction[] {
  const rulesByContext = {
    crm: CRM_ACTION_RULES,
    product: PRODUCT_ACTION_RULES,
    extension: EXTENSION_ACTION_RULES,
  };
  const rules = rulesByContext[context];
  const normalizedFields = errors.map((error) => normalizeField(error.field));

  return rules
    .filter((rule) => rule.fields.some((field) => normalizedFields.includes(field)))
    .map(({ key, label, target }) => ({ key, label, target }));
}

function normalizeField(field: string): string {
  if (field.startsWith('kickoffChecklist.')) return 'kickoffChecklist';
  return field;
}
