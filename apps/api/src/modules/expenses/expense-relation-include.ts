export const EXPENSE_PRODUCT_SELECT = { id: true, name: true } as const;

export const EXPENSE_PROJECT_SELECT = { id: true, code: true, name: true } as const;

export const EXPENSE_CREDENTIAL_SELECT = {
  id: true,
  name: true,
  login: true,
  url: true,
} as const;

export const EXPENSE_PLAN_DETAIL_INCLUDE = {
  project: { select: EXPENSE_PROJECT_SELECT },
  product: { select: EXPENSE_PRODUCT_SELECT },
  credential: { select: EXPENSE_CREDENTIAL_SELECT },
  _count: { select: { expenses: true } },
} as const;

export const EXPENSE_OWNER_INCLUDE = {
  project: { select: EXPENSE_PROJECT_SELECT },
  product: { select: EXPENSE_PRODUCT_SELECT },
  credential: { select: EXPENSE_CREDENTIAL_SELECT },
} as const;
