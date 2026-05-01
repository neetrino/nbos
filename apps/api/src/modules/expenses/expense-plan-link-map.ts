export type LinkedExpensePlanJson = {
  id: string;
  name: string;
};

/**
 * Builds API `linkedExpensePlan` from a loaded `ExpensePlan` row (id + display name).
 */
export function mapExpensePlanToLinkedPlan(
  plan: { id: string; name: string } | null | undefined,
): LinkedExpensePlanJson | null {
  if (!plan?.id || !plan.name?.trim()) {
    return null;
  }
  return { id: plan.id, name: plan.name.trim() };
}
