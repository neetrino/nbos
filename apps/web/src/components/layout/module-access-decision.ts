export type ModuleAccessDecision = 'ALLOW' | 'LOADING' | 'ERROR' | 'DENY';

interface ModuleAccessDecisionInput {
  /** Whether the current URL maps to a permission requirement at all. */
  hasRequirement: boolean;
  isLoading: boolean;
  /** Message from a failed `/api/me` fetch; permissions are unknown, not empty. */
  meLoadError: string | null;
  isPermitted: boolean;
}

/**
 * Resolves what a gated route should render. A failed permission load must not fall through to
 * the page: unknown rights are treated as no access, but reported as an error rather than as a
 * denial, because Access Denied would blame the role for a transport failure.
 */
export function resolveModuleAccessDecision({
  hasRequirement,
  isLoading,
  meLoadError,
  isPermitted,
}: ModuleAccessDecisionInput): ModuleAccessDecision {
  if (!hasRequirement) return 'ALLOW';
  if (isLoading) return 'LOADING';
  if (meLoadError) return 'ERROR';
  return isPermitted ? 'ALLOW' : 'DENY';
}
