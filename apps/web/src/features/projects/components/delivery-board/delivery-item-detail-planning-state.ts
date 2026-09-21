import { coerceOptionalProductPlatform, listedProductTypesForPicker } from '@nbos/shared';
import type { FullExtension, UpdateExtensionData } from '@/lib/api/extensions';
import type { FullProduct, UpdateProductData } from '@/lib/api/products';
import { employeeAvatarUrl } from '@/features/hr/utils/employee-display';

function employeeLabel(e: { firstName: string; lastName: string } | null | undefined): string {
  if (!e) return '';
  return `${e.firstName} ${e.lastName}`.trim();
}

export type ProductPlanSnapshot = {
  name: string;
  deadline: string;
  pmId: string | null;
  pmLabel: string;
  pmAvatar: string | null;
  developerId: string | null;
  developerLabel: string;
  developerAvatar: string | null;
  frontendDeveloperId: string | null;
  frontendDeveloperLabel: string;
  frontendDeveloperAvatar: string | null;
  designerId: string | null;
  designerLabel: string;
  designerAvatar: string | null;
  technicalSpecialistId: string | null;
  technicalSpecialistLabel: string;
  technicalSpecialistAvatar: string | null;
  sellerId: string | null;
  sellerLabel: string;
  sellerAvatar: string | null;
  qaLeadId: string | null;
  qaLeadLabel: string;
  qaLeadAvatar: string | null;
  productCategory: string;
  productType: string;
  productPlatform: string;
  description: string;
  languages: string[];
};

export type ExtensionPlanSnapshot = {
  name: string;
  size: string;
  assignedTo: string | null;
  assigneeLabel: string;
  assigneeAvatar: string | null;
  description: string;
};

export function snapshotProductPlan(p: FullProduct): ProductPlanSnapshot {
  return {
    name: p.name,
    deadline: p.deadline ? p.deadline.slice(0, 10) : '',
    pmId: p.pmId,
    pmLabel: employeeLabel(p.pm),
    pmAvatar: employeeAvatarUrl(p.pm),
    developerId: p.developer?.id ?? null,
    developerLabel: employeeLabel(p.developer),
    developerAvatar: employeeAvatarUrl(p.developer),
    frontendDeveloperId: p.frontendDeveloper?.id ?? null,
    frontendDeveloperLabel: employeeLabel(p.frontendDeveloper),
    frontendDeveloperAvatar: employeeAvatarUrl(p.frontendDeveloper),
    designerId: p.designer?.id ?? null,
    designerLabel: employeeLabel(p.designer),
    designerAvatar: employeeAvatarUrl(p.designer),
    technicalSpecialistId: p.technicalSpecialist?.id ?? null,
    technicalSpecialistLabel: employeeLabel(p.technicalSpecialist),
    technicalSpecialistAvatar: employeeAvatarUrl(p.technicalSpecialist),
    sellerId: p.seller?.id ?? p.sellerId ?? p.order?.deal?.seller?.id ?? null,
    sellerLabel: employeeLabel(p.seller ?? p.order?.deal?.seller),
    sellerAvatar: employeeAvatarUrl(p.seller ?? p.order?.deal?.seller),
    qaLeadId: p.qaLead?.id ?? null,
    qaLeadLabel: employeeLabel(p.qaLead),
    qaLeadAvatar: employeeAvatarUrl(p.qaLead),
    productCategory: p.productCategory,
    productType: p.productType,
    productPlatform: p.productPlatform ?? '',
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
    assigneeAvatar: employeeAvatarUrl(e.assignee),
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
  if (draft.frontendDeveloperId !== snap.frontendDeveloperId) {
    patch.frontendDeveloperId = draft.frontendDeveloperId;
  }
  if (draft.designerId !== snap.designerId) {
    patch.designerId = draft.designerId;
  }
  if (draft.technicalSpecialistId !== snap.technicalSpecialistId) {
    patch.technicalSpecialistId = draft.technicalSpecialistId;
  }
  if (draft.sellerId !== snap.sellerId) {
    patch.sellerId = draft.sellerId;
  }
  if (draft.qaLeadId !== snap.qaLeadId) {
    patch.qaLeadId = draft.qaLeadId;
  }

  Object.assign(patch, productPlanTaxonomyPatch(snap, draft));

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

function productPlanTaxonomyPatch(
  snap: ProductPlanSnapshot,
  draft: ProductPlanSnapshot,
): UpdateProductData {
  if (draft.productCategory !== snap.productCategory) {
    const allowed = listedProductTypesForPicker(draft.productCategory);
    const productType = allowed.includes(draft.productType) ? draft.productType : '';
    return {
      productCategory: draft.productCategory,
      ...(productType ? { productType } : {}),
      productPlatform: coerceOptionalProductPlatform({
        productCategory: draft.productCategory,
        productType: productType || null,
        requested: draft.productPlatform,
      }),
    };
  }
  if (draft.productType !== snap.productType) {
    if (!draft.productType) {
      return {};
    }
    return {
      productType: draft.productType,
      productPlatform: coerceOptionalProductPlatform({
        productCategory: draft.productCategory,
        productType: draft.productType,
        requested: draft.productType === 'MOBILE_APP' ? 'APP' : draft.productPlatform,
      }),
    };
  }
  if (draft.productPlatform !== snap.productPlatform) {
    return {
      productPlatform: coerceOptionalProductPlatform({
        productCategory: draft.productCategory,
        productType: draft.productType,
        requested: draft.productPlatform,
      }),
    };
  }
  return {};
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
