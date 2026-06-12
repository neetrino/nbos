import type { Prisma } from '@nbos/database';

/** Relation guards shared by retention purge and manual permanent delete. */
export const profileALeadPurgeRelationGuards = {
  deal: { is: null },
} satisfies Omit<Prisma.LeadWhereInput, 'id' | 'trashedAt'>;

export const profileADealPurgeRelationGuards = {
  orders: { none: {} },
  supportTickets: { none: {} },
  salesBonusEntries: { none: {} },
  partnerReferralTerms: { is: null },
} satisfies Omit<Prisma.DealWhereInput, 'id' | 'trashedAt'>;

export const profileAPartnerPurgeRelationGuards = {
  orders: { none: {} },
  subscriptions: { none: {} },
  leadsAsSource: { none: {} },
  dealsAsSource: { none: {} },
  partnerReferralTerms: { none: {} },
  partnerAccruals: { none: {} },
  partnerServiceTerms: { none: {} },
  partnerPayoutBatches: { none: {} },
  commissionPolicyRows: { none: {} },
  operationalJournalEntries: { none: {} },
} satisfies Omit<Prisma.PartnerWhereInput, 'id' | 'trashedAt'>;

export const profileAContactPurgeRelationGuards = {
  companies: { none: {} },
  billingForCompanies: { none: {} },
  projects: { none: {} },
  leads: { none: {} },
  deals: { none: {} },
  tickets: { none: {} },
  leadsAsSource: { none: {} },
  dealsAsSource: { none: {} },
  dealAdditionalLinks: { none: {} },
  leadAdditionalLinks: { none: {} },
  projectAdditionalLinks: { none: {} },
  partners: { none: {} },
  partnerServiceTerms: { none: {} },
} satisfies Omit<Prisma.ContactWhereInput, 'id' | 'trashedAt'>;

export const profileACompanyPurgeRelationGuards = {
  projects: { none: {} },
  invoices: { none: {} },
  deals: { none: {} },
  operationalJournalEntries: { none: {} },
  partnerServiceTerms: { none: {} },
} satisfies Omit<Prisma.CompanyWhereInput, 'id' | 'trashedAt'>;

export const profileAProjectPurgeRelationGuards = {
  products: { none: {} },
  extensions: { none: {} },
  orders: { none: {} },
  subscriptions: { none: {} },
  workSpaces: { none: {} },
  credentials: { none: {} },
  credentialFolders: { none: {} },
  domains: { none: {} },
  tickets: { none: {} },
  expenses: { none: {} },
  expensePlans: { none: {} },
  clientServiceRecords: { none: {} },
  bonusEntries: { none: {} },
  bonusReleases: { none: {} },
  productBonusPools: { none: {} },
  payrollBonusAllocationDrafts: { none: {} },
  auditLogs: { none: {} },
  kickoffChecklistItems: { none: {} },
  technicalProfiles: { none: {} },
  technicalAssets: { none: {} },
  technicalEnvironments: { none: {} },
  operationalJournalEntries: { none: {} },
  partnerAccruals: { none: {} },
  partnerServiceTerms: { none: {} },
  additionalContacts: { none: {} },
  invoices: { none: {} },
  teamMembers: { none: {} },
} satisfies Omit<Prisma.ProjectWhereInput, 'id' | 'trashedAt'>;
