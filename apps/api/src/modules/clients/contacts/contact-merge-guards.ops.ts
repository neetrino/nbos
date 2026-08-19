import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { canMergeContacts } from '@nbos/shared';

export const CONTACT_MERGE_ERROR = {
  ABSORBED: 'CONTACT_MERGE_BLOCKED_ABSORBED',
  TRASH: 'CONTACT_MERGE_BLOCKED_TRASH',
  FORBIDDEN: 'CONTACT_MERGE_FORBIDDEN',
  SAME_CONTACT: 'CONTACT_MERGE_SAME_CONTACT',
  RESTORE: 'CONTACT_RESTORE_BLOCKED_MERGED',
} as const;

export interface ContactMergeGuardRow {
  id: string;
  trashedAt: Date | null;
  mergedIntoId: string | null;
}

export function assertContactMergePair(survivorId: string, absorbedId: string): void {
  if (survivorId === absorbedId) {
    throw mergeBlocked(CONTACT_MERGE_ERROR.SAME_CONTACT, 'Cannot merge a Contact into itself.');
  }
}

export function assertContactMergeEligible(
  contact: ContactMergeGuardRow,
  label: 'survivor' | 'absorbed',
): void {
  if (contact.trashedAt) {
    throw mergeBlocked(CONTACT_MERGE_ERROR.TRASH, `Cannot merge: ${label} is in Trash.`);
  }
  if (contact.mergedIntoId) {
    throw mergeBlocked(
      CONTACT_MERGE_ERROR.ABSORBED,
      `Cannot merge: ${label} was already absorbed.`,
    );
  }
}

export function assertCanMergeContacts(roleSlug: string): void {
  if (canMergeContacts(roleSlug)) return;
  throw new ForbiddenException({
    statusCode: 403,
    code: CONTACT_MERGE_ERROR.FORBIDDEN,
    message:
      'You cannot merge Contacts. Only CEO, PM, and Owner can merge. Seller and Marketing cannot.',
  });
}

function mergeBlocked(code: string, message: string): BadRequestException {
  return new BadRequestException({ statusCode: 400, code, message });
}
