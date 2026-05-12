/** Deep links into Clients + Portfolio (aligned with delivery board links). */
export function clientPortfolioContactPath(contactId: string): string {
  return `/clients/portfolio/contact/${encodeURIComponent(contactId)}`;
}

export function clientPortfolioCompanyPath(companyId: string): string {
  return `/clients/portfolio/company/${encodeURIComponent(companyId)}`;
}
