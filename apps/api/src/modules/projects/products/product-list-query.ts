import { employeePersonSelect } from '../../../common/employee-person.select';
import { liveMaintenanceWhere } from '../project-hub-status';

/** Shared list include for Delivery Board, pickers, and generic `GET /products`. */
export const PRODUCT_LIST_INCLUDE = {
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      companyId: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  pm: { select: employeePersonSelect },
  developer: { select: employeePersonSelect },
  frontendDeveloper: { select: employeePersonSelect },
  designer: { select: employeePersonSelect },
  technicalSpecialist: { select: employeePersonSelect },
  qaLead: { select: employeePersonSelect },
  order: {
    select: {
      id: true,
      code: true,
      status: true,
      paymentType: true,
      invoices: { select: { moneyStatus: true } },
    },
  },
  _count: { select: { extensions: true, tasks: true, tickets: true } },
} as const;

/** Product Hub directory: live-maintenance probe for derived `hubView`. */
export const PRODUCT_HUB_LIST_INCLUDE = {
  ...PRODUCT_LIST_INCLUDE,
  subscriptions: {
    where: liveMaintenanceWhere(),
    select: { id: true },
    take: 1,
  },
} as const;

export function splitProductListSubscriptions<T extends { subscriptions?: ReadonlyArray<unknown> }>(
  row: T,
): { listed: Omit<T, 'subscriptions'>; subscriptions: ReadonlyArray<unknown> | undefined } {
  const { subscriptions, ...listed } = row;
  return { listed, subscriptions };
}
