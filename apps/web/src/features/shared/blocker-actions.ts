import type { ApiFieldError } from '@/lib/api-errors';
import {
  DEAL_SHEET_SECTION,
  LEAD_SHEET_SECTION,
  type DealSheetSectionId,
  type LeadSheetSectionId,
} from '@/features/shared/crm-sheet-section-ids';

export interface BlockerDirectAction {
  key: string;
  label: string;
  target: 'details' | 'finance' | 'project';
}

/** Navigation applied when opening Deal sheet from a CRM stage gate. */
export type DealSheetBlockerIntent =
  | { kind: 'tab'; tab: 'general' | 'history' | 'invoice' | 'task' | 'calls' }
  | { kind: 'general-section'; sectionId: DealSheetSectionId }
  | { kind: 'invoice-tab-expand-create' };

interface ResolveBlockerActionsArgs {
  context: 'crm' | 'product' | 'extension';
  errors: ApiFieldError[];
}

const CRM_ACTION_RULES = [
  {
    key: 'attribution',
    label: 'Go to attribution & contact',
    target: 'details',
    fields: [
      'name',
      'contactName',
      'contactMethod',
      'source',
      'sourceDetail',
      'sourcePartnerId',
      'sourceContactId',
      'whichOne',
      'assignedTo',
    ],
  },
  {
    key: 'offer',
    label: 'Go to offer',
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
    label: 'Go to contract',
    target: 'details',
    fields: ['companyId', 'contractProof', 'pmId', 'deadline', 'existingProductId'],
  },
  {
    key: 'finance',
    label: 'Go to invoice',
    target: 'finance',
    fields: ['invoice', 'payment'],
  },
] as const;

const PRODUCT_ACTION_RULES = [
  {
    key: 'pm-intake',
    label: 'Open product overview',
    target: 'project',
    fields: ['checklist', 'description', 'deadline'],
  },
  {
    key: 'product-workspace-tasks',
    label: 'Open Work Space',
    target: 'project',
    fields: ['tasks'],
  },
  {
    key: 'product-support-tickets',
    label: 'Open Tickets',
    target: 'project',
    fields: ['tickets'],
  },
  {
    key: 'product-extensions',
    label: 'Open Extensions',
    target: 'project',
    fields: ['extensions'],
  },
  {
    key: 'product-finance',
    label: 'Open Finance',
    target: 'project',
    fields: ['order', 'finance'],
  },
] as const;

const EXTENSION_ACTION_RULES = [
  {
    key: 'extension-workspace-tasks',
    label: 'Open Work Space',
    target: 'project',
    fields: ['tasks'],
  },
  {
    key: 'extension-intake',
    label: 'Open extension on product',
    target: 'project',
    fields: ['checklist', 'description', 'assignedTo'],
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
  if (field.startsWith('checklist.')) return 'checklist';
  return field;
}

const CRM_MARKETING_FIELDS = new Set([
  'source',
  'sourceDetail',
  'sourcePartnerId',
  'sourceContactId',
  'whichOne',
]);

const LEAD_CONTACT_FIELDS = new Set(['name', 'contactName', 'contactMethod']);

function normalizedErrorFields(errors: ApiFieldError[]): string[] {
  return errors.map((error) => normalizeField(error.field));
}

/**
 * Maps a CRM blocker shortcut to the Deal sheet (tab or scroll target).
 */
export function resolveDealSheetIntentFromBlockerAction(
  action: Pick<BlockerDirectAction, 'key' | 'target'>,
  errors: ApiFieldError[],
): DealSheetBlockerIntent {
  if (action.target === 'finance') {
    return { kind: 'tab', tab: 'invoice' };
  }
  if (action.key === 'offer' || action.key === 'contract') {
    return { kind: 'general-section', sectionId: DEAL_SHEET_SECTION.OFFER_CONTRACT };
  }
  if (action.key === 'attribution') {
    const fieldSet = new Set(normalizedErrorFields(errors));
    if ([...fieldSet].some((field) => CRM_MARKETING_FIELDS.has(field))) {
      return { kind: 'general-section', sectionId: DEAL_SHEET_SECTION.MARKETING };
    }
    if (fieldSet.has('assignedTo')) {
      return { kind: 'general-section', sectionId: DEAL_SHEET_SECTION.CONTACT_TEAM };
    }
    return { kind: 'general-section', sectionId: DEAL_SHEET_SECTION.INFO };
  }
  return { kind: 'tab', tab: 'general' };
}

/**
 * Best scroll target on the Lead general tab for the current gate errors.
 */
export function resolveLeadSheetSectionFromErrors(errors: ApiFieldError[]): LeadSheetSectionId {
  const fieldSet = new Set(normalizedErrorFields(errors));
  if ([...fieldSet].some((field) => CRM_MARKETING_FIELDS.has(field))) {
    return LEAD_SHEET_SECTION.MARKETING;
  }
  if ([...fieldSet].some((field) => LEAD_CONTACT_FIELDS.has(field))) {
    return LEAD_SHEET_SECTION.CONTACT;
  }
  if (fieldSet.has('assignedTo')) {
    return LEAD_SHEET_SECTION.ASSIGNMENT;
  }
  return LEAD_SHEET_SECTION.CONTACT;
}
