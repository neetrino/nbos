import type { Prisma } from '@nbos/database';
import {
  DRIVE_FINANCE_INHERITED_LINK_ENTITY_TYPES,
  DRIVE_GENERAL_CONFIDENTIALITIES,
  DRIVE_GENERAL_INHERITED_LINK_ENTITY_TYPES,
  DRIVE_LEGAL_INHERITED_LINK_ENTITY_TYPES,
  type DriveInheritedLinkTarget,
} from './drive-inherited-link-entity-groups';

function buildActiveLinkSomeWhere(
  targets: readonly DriveInheritedLinkTarget[],
  allowedEntityTypes: readonly string[],
): Prisma.FileLinkWhereInput | undefined {
  const filtered = targets.filter((target) => allowedEntityTypes.includes(target.entityType));
  if (filtered.length === 0) {
    return undefined;
  }
  return {
    unlinkedAt: null,
    OR: filtered.map((target) => ({
      entityType: target.entityType,
      entityId: target.entityId,
    })),
  };
}

/**
 * Multi-link resolver: each confidentiality tier requires a matching active `FileLink` graph.
 * `SECRET_ADJACENT` never inherits — owner/uploader/grant only.
 */
export function buildDriveMultiLinkConfidentialityOr(input: {
  generalTargets: readonly DriveInheritedLinkTarget[];
  financeTargets: readonly DriveInheritedLinkTarget[];
  legalTargets: readonly DriveInheritedLinkTarget[];
  employeeId: string;
  grantAccess: Prisma.FileAssetWhereInput;
}): Prisma.FileAssetWhereInput[] {
  const paths: Prisma.FileAssetWhereInput[] = [
    { ownerId: input.employeeId },
    { createdById: input.employeeId },
    input.grantAccess,
  ];

  const generalLink = buildActiveLinkSomeWhere(
    input.generalTargets,
    DRIVE_GENERAL_INHERITED_LINK_ENTITY_TYPES,
  );
  if (generalLink) {
    paths.push({
      AND: [
        { links: { some: generalLink } },
        { confidentiality: { in: [...DRIVE_GENERAL_CONFIDENTIALITIES] } },
      ],
    });
  }

  const financeLink = buildActiveLinkSomeWhere(
    input.financeTargets,
    DRIVE_FINANCE_INHERITED_LINK_ENTITY_TYPES,
  );
  if (financeLink) {
    paths.push({
      AND: [{ links: { some: financeLink } }, { confidentiality: 'FINANCE_SENSITIVE' }],
    });
  }

  const legalLink = buildActiveLinkSomeWhere(
    input.legalTargets,
    DRIVE_LEGAL_INHERITED_LINK_ENTITY_TYPES,
  );
  if (legalLink) {
    paths.push({
      AND: [{ links: { some: legalLink } }, { confidentiality: 'LEGAL_SENSITIVE' }],
    });
  }

  return paths;
}
