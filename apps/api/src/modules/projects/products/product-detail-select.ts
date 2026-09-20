import {
  employeePersonSelect,
  employeePersonWithEmailSelect,
} from '../../../common/employee-person.select';

export const productContactSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const productAdditionalContactsInclude = {
  additionalContacts: {
    include: { contact: { select: productContactSummarySelect } },
  },
} as const;

export const PRODUCT_DETAIL_INCLUDE = {
  contact: { select: productContactSummarySelect },
  company: { select: { id: true, name: true } },
  ...productAdditionalContactsInclude,
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      contactId: true,
      companyId: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      credentials: {
        where: { trashedAt: null },
        select: { category: true },
      },
      domains: { select: { status: true } },
      _count: {
        select: {
          credentials: { where: { trashedAt: null } },
          domains: true,
        },
      },
    },
  },
  pm: { select: employeePersonWithEmailSelect },
  developer: { select: employeePersonWithEmailSelect },
  frontendDeveloper: { select: employeePersonWithEmailSelect },
  designer: { select: employeePersonWithEmailSelect },
  technicalSpecialist: { select: employeePersonWithEmailSelect },
  seller: { select: employeePersonWithEmailSelect },
  qaLead: { select: employeePersonWithEmailSelect },
  closedBy: { select: employeePersonSelect },
  technicalProfiles: {
    select: {
      productionUrl: true,
      stagingUrl: true,
      repositoryUrl: true,
      hostingProvider: true,
      technicalOwnerId: true,
    },
  },
  order: {
    include: {
      deal: {
        select: {
          id: true,
          name: true,
          code: true,
          offerFileUrl: true,
          contractFileUrl: true,
          seller: { select: employeePersonSelect },
        },
      },
      invoices: {
        select: { id: true, code: true, moneyStatus: true, amount: true, dueDate: true },
      },
    },
  },
  extensions: {
    include: {
      assignee: { select: employeePersonSelect },
      order: {
        select: {
          id: true,
          deal: { select: { id: true, code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  tasks: {
    select: { id: true, code: true, title: true, status: true, priority: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  },
  tickets: {
    select: { id: true, code: true, title: true, status: true, priority: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  },
  workSpace: { select: { id: true } },
} as const;
