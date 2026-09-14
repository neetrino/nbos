/**
 * Governance authority is tied to the employee's primary role.
 * Additional permission roles grant access but never delegation authority.
 */
export function roleAssignmentAuthority(primaryRole: string): string {
  return primaryRole;
}
