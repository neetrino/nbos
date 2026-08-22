import type { CallAccessActor } from './call-access.types';

export const ACTOR_ID = 'emp-1';
export const OTHER_EMPLOYEE_ID = 'emp-2';
export const COLLEAGUE_ID = 'emp-colleague';
export const DEPT_SALES = 'dept-sales';
export const DEPT_OTHER = 'dept-other';

export function callActor(overrides: Partial<CallAccessActor> = {}): CallAccessActor {
  return {
    employeeId: ACTOR_ID,
    departmentIds: [DEPT_SALES],
    permissions: { CRM_LEADS_VIEW: 'OWN', CRM_DEALS_VIEW: 'OWN' },
    ...overrides,
  };
}

export const OWN_ACTOR = callActor();
export const ALL_ACTOR = callActor({
  permissions: { CRM_LEADS_VIEW: 'ALL', CRM_DEALS_VIEW: 'ALL' },
});
export const NONE_ACTOR = callActor({
  permissions: { CRM_LEADS_VIEW: 'NONE', CRM_DEALS_VIEW: 'NONE' },
});
export const DEPARTMENT_ACTOR = callActor({
  permissions: { CRM_LEADS_VIEW: 'DEPARTMENT', CRM_DEALS_VIEW: 'DEPARTMENT' },
});

export const VIEW_ONLY_ALL_ACTOR = callActor({
  permissions: { CRM_LEADS_VIEW: 'ALL', CRM_DEALS_VIEW: 'ALL' },
});

export const EDIT_OWN_ACTOR = callActor({
  permissions: {
    CRM_LEADS_VIEW: 'OWN',
    CRM_DEALS_VIEW: 'OWN',
    CRM_LEADS_EDIT: 'OWN',
    CRM_DEALS_EDIT: 'OWN',
  },
});

export const EDIT_ALL_ACTOR = callActor({
  permissions: {
    CRM_LEADS_VIEW: 'ALL',
    CRM_DEALS_VIEW: 'ALL',
    CRM_LEADS_EDIT: 'ALL',
    CRM_DEALS_EDIT: 'ALL',
  },
});

export const EDIT_DEPARTMENT_ACTOR = callActor({
  permissions: {
    CRM_LEADS_VIEW: 'DEPARTMENT',
    CRM_DEALS_VIEW: 'DEPARTMENT',
    CRM_LEADS_EDIT: 'DEPARTMENT',
    CRM_DEALS_EDIT: 'DEPARTMENT',
  },
});

export const EDIT_NONE_ACTOR = callActor({
  permissions: {
    CRM_LEADS_VIEW: 'ALL',
    CRM_DEALS_VIEW: 'ALL',
    CRM_LEADS_EDIT: 'NONE',
    CRM_DEALS_EDIT: 'NONE',
  },
});
