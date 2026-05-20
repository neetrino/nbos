/** Finance entity types that use Drive proofs with restricted visibility. */
export const FINANCE_DRIVE_ENTITY_TYPES = [
  'INVOICE',
  'PAYMENT',
  'EXPENSE',
  'CLIENT_SERVICE_RECORD',
] as const;

export type FinanceDriveEntityType = (typeof FINANCE_DRIVE_ENTITY_TYPES)[number];

export const FINANCE_PROOF_PURPOSES = [
  'INVOICE_REQUEST_PROOF',
  'PAYMENT_PROOF',
  'EXPENSE_PROOF',
] as const;

export type FinanceProofPurpose = (typeof FINANCE_PROOF_PURPOSES)[number];

const FINANCE_ENTITY_SET = new Set<string>(FINANCE_DRIVE_ENTITY_TYPES);
const FINANCE_PROOF_SET = new Set<string>(FINANCE_PROOF_PURPOSES);

export function isFinanceDriveEntity(entityType: string): boolean {
  return FINANCE_ENTITY_SET.has(entityType.trim().toUpperCase());
}

export function isFinanceProofPurpose(purpose: string | undefined): boolean {
  if (!purpose?.trim()) return false;
  return FINANCE_PROOF_SET.has(purpose.trim().toUpperCase());
}

export interface FinanceDriveUploadDefaults {
  sourceModule: string;
  visibility: 'RESTRICTED';
  confidentiality: 'FINANCE_SENSITIVE';
  linkType: 'PROOF';
  purpose: FinanceProofPurpose;
}

/** Default upload metadata for finance proof attachments (canon: finance-restricted). */
export function resolveFinanceDriveUploadDefaults(
  entityType: string,
  purposeInput?: string,
): FinanceDriveUploadDefaults | null {
  if (!isFinanceDriveEntity(entityType)) {
    return null;
  }

  const normalizedPurpose = purposeInput?.trim().toUpperCase();
  let purpose: FinanceProofPurpose = 'EXPENSE_PROOF';
  if (entityType.toUpperCase() === 'INVOICE') {
    purpose = 'INVOICE_REQUEST_PROOF';
  } else if (entityType.toUpperCase() === 'PAYMENT') {
    purpose = 'PAYMENT_PROOF';
  } else if (normalizedPurpose && isFinanceProofPurpose(normalizedPurpose)) {
    purpose = normalizedPurpose as FinanceProofPurpose;
  }

  return {
    sourceModule: 'FINANCE',
    visibility: 'RESTRICTED',
    confidentiality: 'FINANCE_SENSITIVE',
    linkType: 'PROOF',
    purpose,
  };
}
