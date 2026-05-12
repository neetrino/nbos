import type { FullExtension, UpdateExtensionData } from '@/lib/api/extensions';
import type { FullProduct, UpdateProductData } from '@/lib/api/products';
import { PRODUCT_TYPES_BY_CATEGORY } from '@/features/projects/constants/projects';

function employeeLabel(e: { firstName: string; lastName: string } | null | undefined): string {
  if (!e) return '';
  return `${e.firstName} ${e.lastName}`.trim();
}

export type ProductPlanSnapshot = {
  name: string;
  deadline: string;
  pmId: string | null;
  pmLabel: string;
  developerId: string | null;
  developerLabel: string;
  designerId: string | null;
  designerLabel: string;
  technicalSpecialistId: string | null;
  technicalSpecialistLabel: string;
  qaLeadId: string | null;
  qaLeadLabel: string;
  productCategory: string;
  productType: string;
  description: string;
  languages: string[];
};

export type ExtensionPlanSnapshot = {
  name: string;
  size: string;
  assignedTo: string | null;
  assigneeLabel: string;
  description: string;
};

export function snapshotProductPlan(p: FullProduct): ProductPlanSnapshot {
  return {
    name: p.name,
    deadline: p.deadline ? p.deadline.slice(0, 10) : '',
    pmId: p.pmId,
    pmLabel: employeeLabel(p.pm),
    developerId: p.developer?.id ?? null,
    developerLabel: employeeLabel(p.developer),
    designerId: p.designer?.id ?? null,
    designerLabel: employeeLabel(p.designer),
    technicalSpecialistId: p.technicalSpecialist?.id ?? null,
    technicalSpecialistLabel: employeeLabel(p.technicalSpecialist),
    qaLeadId: p.qaLead?.id ?? null,
    qaLeadLabel: employeeLabel(p.qaLead),
    productCategory: p.productCategory,
    productType: p.productType,
    description: p.description ?? '',
    languages: [...(p.languages ?? [])],
  };
}

export function snapshotExtensionPlan(e: FullExtension): ExtensionPlanSnapshot {
  return {
    name: e.name,
    size: e.size,
    assignedTo: e.assignedTo,
    assigneeLabel: e.assignee ? `${e.assignee.firstName} ${e.assignee.lastName}` : '',
    description: e.description ?? '',
  };
}

export function buildProductPlanPatch(
  snap: ProductPlanSnapshot,
  draft: ProductPlanSnapshot,
): UpdateProductData | null {
  const patch: UpdateProductData = {};

  const resolvedName = draft.name.trim() || snap.name;
  if (resolvedName !== snap.name) {
    patch.name = resolvedName;
  }

  const draftDeadline = draft.deadline.trim() ? draft.deadline : null;
  const snapDeadline = snap.deadline.trim() ? snap.deadline : null;
  if (draftDeadline !== snapDeadline) {
    patch.deadline = draftDeadline;
  }

  if (draft.pmId !== snap.pmId) {
    patch.pmId = draft.pmId;
  }

  if (draft.developerId !== snap.developerId) {
    patch.developerId = draft.developerId;
  }
  if (draft.designerId !== snap.designerId) {
    patch.designerId = draft.designerId;
  }
  if (draft.technicalSpecialistId !== snap.technicalSpecialistId) {
    patch.technicalSpecialistId = draft.technicalSpecialistId;
  }
  if (draft.qaLeadId !== snap.qaLeadId) {
    patch.qaLeadId = draft.qaLeadId;
  }

  if (draft.productCategory !== snap.productCategory) {
    patch.productCategory = draft.productCategory;
    const allowed = PRODUCT_TYPES_BY_CATEGORY[draft.productCategory] ?? [];
    patch.productType = allowed.includes(draft.productType)
      ? draft.productType
      : (allowed[0] ?? draft.productType);
  } else if (draft.productType !== snap.productType) {
    patch.productType = draft.productType;
  }

  const nextDesc = draft.description;
  if (nextDesc !== snap.description) {
    patch.description = nextDesc.trim() ? nextDesc : null;
  }

  const snapLang = [...snap.languages].sort().join('\0');
  const draftLang = [...draft.languages].sort().join('\0');
  if (snapLang !== draftLang) {
    patch.languages = draft.languages;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function buildExtensionPlanPatch(
  snap: ExtensionPlanSnapshot,
  draft: ExtensionPlanSnapshot,
): UpdateExtensionData | null {
  const patch: UpdateExtensionData = {};

  const resolvedName = draft.name.trim() || snap.name;
  if (resolvedName !== snap.name) {
    patch.name = resolvedName;
  }

  if (draft.size !== snap.size) {
    patch.size = draft.size;
  }

  if (draft.assignedTo !== snap.assignedTo) {
    patch.assignedTo = draft.assignedTo;
  }

  const nextDesc = draft.description;
  if (nextDesc !== snap.description) {
    patch.description = nextDesc.trim() ? nextDesc : null;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
