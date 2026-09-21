import {
  parseBaseProfileWriteBody,
  type BaseProfileWriteInput,
  type DeliveryRoleUnitInput,
  type DeliveryDesignMode,
  type DeliveryEntityKind,
  type DeliveryImplementationBase,
  type ProductCategoryKey,
  type ProductTypeKey,
} from '@nbos/shared';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { dateInputToIso, isValidDateInput, todayDateInputValue } from './effective-from';
import { buildCompleteRoleUnitVector, createEmptyRoleUnitDrafts } from './role-units-draft';
import type { RoleUnitDraftRow } from './role-units-draft';

export type ProfileDraft = {
  profileKey: string;
  entityKind: DeliveryEntityKind;
  productType: ProductTypeKey | typeof OPTIONAL_SELECT_NONE;
  productCategory: ProductCategoryKey | typeof OPTIONAL_SELECT_NONE;
  implementationBase: DeliveryImplementationBase;
  designMode: DeliveryDesignMode;
  aiDesignerReview: boolean;
  description: string;
  effectiveFrom: string;
  roleUnits: RoleUnitDraftRow[];
  includedFunctionIds: string[];
};

export type BaseProfileBuildResult =
  | { error: 'effectiveFrom' }
  | { error: 'roleUnits' }
  | { error: 'invalid'; caught: unknown }
  | { error: null; body: BaseProfileWriteInput };

export function emptyProfileDraft(): ProfileDraft {
  return {
    profileKey: '',
    entityKind: 'PRODUCT',
    productType: OPTIONAL_SELECT_NONE,
    productCategory: OPTIONAL_SELECT_NONE,
    implementationBase: 'FROM_SCRATCH',
    designMode: 'FULL_DESIGN',
    aiDesignerReview: false,
    description: '',
    effectiveFrom: todayDateInputValue(),
    roleUnits: createEmptyRoleUnitDrafts(),
    includedFunctionIds: [],
  };
}

export function optionalEnumToNull<T extends string>(
  value: T | typeof OPTIONAL_SELECT_NONE,
): T | null {
  return value === OPTIONAL_SELECT_NONE ? null : value;
}

export function buildBaseProfileWriteBody(draft: ProfileDraft): BaseProfileBuildResult {
  if (!isValidDateInput(draft.effectiveFrom)) {
    return { error: 'effectiveFrom' };
  }
  const roleUnits = buildCompleteRoleUnitVector(draft.roleUnits);
  if (roleUnits === null) {
    return { error: 'roleUnits' };
  }
  try {
    return { error: null, body: parseProfileDraft(draft, roleUnits) };
  } catch (caught) {
    return { error: 'invalid', caught };
  }
}

function parseProfileDraft(draft: ProfileDraft, roleUnits: DeliveryRoleUnitInput[]) {
  return parseBaseProfileWriteBody({
    profileKey: draft.profileKey,
    entityKind: draft.entityKind,
    productType: optionalEnumToNull(draft.productType),
    productCategory: optionalEnumToNull(draft.productCategory),
    implementationBase: draft.implementationBase,
    designMode: draft.designMode,
    aiDesignerReview: draft.aiDesignerReview,
    description: draft.description,
    effectiveFrom: dateInputToIso(draft.effectiveFrom),
    roleUnits,
    includedFunctionIds: draft.entityKind === 'PRODUCT' ? draft.includedFunctionIds : [],
  });
}
