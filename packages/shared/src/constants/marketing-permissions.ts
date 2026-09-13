/**
 * Marketing RBAC module.
 *
 * Deliberately separate from `CRM_LEADS`. Marketing owns campaign budgets: launching an
 * activity proposes a finance expense, so campaign management must not ride along with
 * lead editing. Gating it on `CRM_LEADS EDIT` would let every Seller open marketing
 * accounts while leaving the Marketing Specialist read-only in their own module.
 *
 * Two reads stay on `CRM_LEADS VIEW` because CRM lead and deal forms depend on them:
 * the active `Where` dictionary and the attribution `Which one` options.
 *
 * Canon: `docs/NBOS/02-Modules/18-Marketing/00-Marketing-Overview.md`.
 */

/** Marketing board, activities, accounts, attribution review and performance dashboard. */
export const MARKETING_MODULE = 'MARKETING' as const;

/**
 * Roles holding Marketing by default: Platform Owner / Founder (legacy `owner`), CEO and
 * Head of Marketing. Every other role starts at `NONE` and is granted explicitly in
 * Settings → Permissions / RBAC — including the Marketing Specialist, whose scope is a
 * deliberate decision rather than a side effect of CRM access.
 */
export const MARKETING_DEFAULT_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-head-marketing',
] as const;

export const MARKETING_DEFAULT_ROLE_SLUGS = ['owner', 'ceo', 'head-marketing'] as const;

export const MARKETING_DEFAULT_SCOPE = 'ALL' as const;
