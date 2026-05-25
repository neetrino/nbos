const KNOWN_FIELD_LABELS: Record<string, string> = {
  source: 'From',
  sourceDetail: 'Where',
  sourcePartnerId: 'Partner',
  sourceContactId: 'Client / referral contact',
  whichOne: 'Which one',
  amount: 'Amount',
  paymentType: 'Payment type',
  productCategory: 'Product category',
  productType: 'Product type',
  offerProof: 'Offer file (Drive)',
  companyId: 'Company',
  contractProof: 'Contract file (Drive)',
  pmId: 'Project manager',
  deadline: 'Deadline',
  existingProductId: 'Existing product',
  notes: 'Lost reason',
  name: 'Inquiry title',
  contactName: 'Contact name',
  contactMethod: 'Phone or email',
  assignedTo: 'Assigned seller',
  invoice: 'Deposit invoice',
  payment: 'Payment confirmation',
  partnerReferralTerms: 'Partner referral terms',
};

export function formatDealStageGateFieldLabel(field: string): string {
  return KNOWN_FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, ' $1').trim();
}

export function formatDealStageGateFieldList(fields: string[]): string {
  const unique = [...new Set(fields.map(formatDealStageGateFieldLabel))];
  return unique.join(', ');
}
