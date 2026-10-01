import type {
  CompanyPortfolioResponse,
  ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';

export function portfolioClientMessengerLabel(
  data: ContactPortfolioResponse | CompanyPortfolioResponse,
): string {
  if (data.scope === 'contact') return contactLabel(data.contact);
  return companyLabel(data.company);
}

function contactLabel(contact: Record<string, unknown>): string {
  const parts = [contact.firstName, contact.lastName].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );
  return parts.join(' ') || 'this contact';
}

function companyLabel(company: Record<string, unknown>): string {
  return typeof company.name === 'string' && company.name.trim()
    ? company.name.trim()
    : 'this company';
}
