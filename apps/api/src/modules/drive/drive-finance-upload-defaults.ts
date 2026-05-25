import { resolveFinanceDriveUploadDefaults } from '@nbos/shared';
import type {
  FileConfidentialityEnum,
  FileLinkTypeEnum,
  FilePurposeEnum,
  FileVisibilityEnum,
} from '@nbos/database';
import { pickConfidentiality, pickLinkType, pickPurpose, pickVisibility } from './drive-metadata';

function requirePurpose(value: string | undefined): FilePurposeEnum {
  const picked = pickPurpose(value) ?? pickPurpose('OTHER');
  if (!picked) {
    throw new Error('Drive upload requires a valid file purpose');
  }
  return picked;
}

export interface FinanceAwareUploadFieldsInput {
  purpose?: string;
  sourceModule?: string;
  visibility?: string;
  confidentiality?: string;
  linkType?: string;
}

export interface FinanceAwareUploadFieldsResolved {
  purpose: FilePurposeEnum;
  sourceModule?: string;
  visibility: FileVisibilityEnum;
  confidentiality: FileConfidentialityEnum;
  linkType: FileLinkTypeEnum;
}

/** Applies finance-restricted defaults when uploading to invoice/payment/expense entities. */
export function applyFinanceDriveUploadDefaults(
  entityType: string,
  input: FinanceAwareUploadFieldsInput,
): FinanceAwareUploadFieldsResolved {
  const finance = resolveFinanceDriveUploadDefaults(entityType, input.purpose);
  if (!finance) {
    return {
      purpose: requirePurpose(input.purpose),
      sourceModule: input.sourceModule?.trim(),
      visibility: pickVisibility(input.visibility),
      confidentiality: pickConfidentiality(input.confidentiality),
      linkType: pickLinkType(input.linkType),
    };
  }

  return {
    purpose: input.purpose ? requirePurpose(input.purpose) : requirePurpose(finance.purpose),
    sourceModule: input.sourceModule?.trim() || finance.sourceModule,
    visibility: pickVisibility(finance.visibility),
    confidentiality: pickConfidentiality(finance.confidentiality),
    linkType: pickLinkType(finance.linkType),
  };
}
