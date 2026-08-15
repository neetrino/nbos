/** Compact employee identity for cards, boards, and relation chips (includes photo URL). */
export const employeePersonSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

/** Person select with email (detail sheets / rich team rows). */
export const employeePersonWithEmailSelect = {
  ...employeePersonSelect,
  email: true,
} as const;
