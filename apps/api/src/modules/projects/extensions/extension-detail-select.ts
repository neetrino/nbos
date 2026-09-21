import {
  employeePersonSelect,
  employeePersonWithEmailSelect,
} from '../../../common/employee-person.select';

export const EXTENSION_LIST_INCLUDE = {
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      productType: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  },
  assignee: { select: employeePersonSelect },
  order: {
    select: {
      id: true,
      code: true,
      status: true,
      paymentType: true,
      invoices: { select: { moneyStatus: true } },
    },
  },
  _count: { select: { tasks: true } },
} as const;

export const EXTENSION_DETAIL_INCLUDE = {
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      contactId: true,
      companyId: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      productType: true,
      status: true,
      languages: true,
      companyId: true,
      company: { select: { id: true, name: true } },
      technicalProfiles: {
        select: {
          productionUrl: true,
          stagingUrl: true,
          repositoryUrl: true,
          hostingProvider: true,
          technicalOwnerId: true,
        },
      },
    },
  },
  assignee: { select: employeePersonWithEmailSelect },
  closedBy: { select: employeePersonSelect },
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
  tasks: {
    select: { id: true, code: true, title: true, status: true, priority: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  },
} as const;
