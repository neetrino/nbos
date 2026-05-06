/** DOM ids for scroll targets from CRM transition blocker navigation. */

export const DEAL_SHEET_SECTION = {
  INFO: 'deal-sheet-section-info',
  OFFER_CONTRACT: 'deal-sheet-section-offer-contract',
  MARKETING: 'deal-sheet-section-marketing',
  CONTACT_TEAM: 'deal-sheet-section-contact',
} as const;

export type DealSheetSectionId = (typeof DEAL_SHEET_SECTION)[keyof typeof DEAL_SHEET_SECTION];

export const LEAD_SHEET_SECTION = {
  CONTACT: 'lead-sheet-section-contact',
  MARKETING: 'lead-sheet-section-marketing',
  ASSIGNMENT: 'lead-sheet-section-assignment',
} as const;

export type LeadSheetSectionId = (typeof LEAD_SHEET_SECTION)[keyof typeof LEAD_SHEET_SECTION];
