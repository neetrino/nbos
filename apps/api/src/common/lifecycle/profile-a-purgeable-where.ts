import type { Prisma } from '@nbos/database';

export function profileARetentionCutoff(now: Date, retentionMs: number): Date {
  return new Date(now.getTime() - retentionMs);
}

function trashedPastRetention(cutoff: Date): { lt: Date; not: null } {
  return { lt: cutoff, not: null };
}

export function purgeableTrashedLeadWhere(now: Date, retentionMs: number): Prisma.LeadWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return { trashedAt: trashedPastRetention(cutoff), deal: { is: null } };
}

export function purgeableTrashedDealWhere(now: Date, retentionMs: number): Prisma.DealWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return {
    trashedAt: trashedPastRetention(cutoff),
    orders: { none: {} },
    supportTickets: { none: {} },
    salesBonusEntries: { none: {} },
    partnerReferralTerms: { is: null },
  };
}

export function purgeableTrashedPartnerWhere(
  now: Date,
  retentionMs: number,
): Prisma.PartnerWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return {
    trashedAt: trashedPastRetention(cutoff),
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
  };
}

export function purgeableTrashedContactWhere(
  now: Date,
  retentionMs: number,
): Prisma.ContactWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return {
    trashedAt: trashedPastRetention(cutoff),
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
  };
}

export function purgeableTrashedCompanyWhere(
  now: Date,
  retentionMs: number,
): Prisma.CompanyWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return {
    trashedAt: trashedPastRetention(cutoff),
    projects: { none: {} },
    invoices: { none: {} },
    deals: { none: {} },
    operationalJournalEntries: { none: {} },
    partnerServiceTerms: { none: {} },
  };
}

export function purgeableTrashedProjectWhere(
  now: Date,
  retentionMs: number,
): Prisma.ProjectWhereInput {
  const cutoff = profileARetentionCutoff(now, retentionMs);
  return {
    trashedAt: trashedPastRetention(cutoff),
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
  };
}
