import { EMPLOYEE_PERSON_SELECT } from '../client-responsible-employee.ops';

export const COMPANY_PERSON_SELECT = { id: true, firstName: true, lastName: true } as const;

export const COMPANY_LIST_INCLUDE = {
  contact: { select: COMPANY_PERSON_SELECT },
  billingContact: { select: COMPANY_PERSON_SELECT },
  additionalContacts: {
    include: { contact: { select: COMPANY_PERSON_SELECT } },
  },
  responsibleEmployee: { select: EMPLOYEE_PERSON_SELECT },
  _count: { select: { projects: true, products: true, invoices: true } },
} as const;

export interface CreateCompanyDto {
  name: string;
  contactId?: string | null;
  contactIds?: string[];
  billingContactId?: string | null;
  type?: string;
  taxId?: string;
  legalName?: string | null;
  legalAddress?: string;
  bankDetails?: Record<string, unknown> | null;
  taxStatus?: string;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  notes?: string;
  responsibleEmployeeId?: string | null;
}

export interface CompanyQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  taxStatus?: string;
  type?: string;
  scope?: string;
  responsibleEmployeeId?: string;
}
