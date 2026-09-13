/**
 * CRM RBAC modules.
 *
 * Leads and deals are separate modules because the access matrix separates them: PM and Head of
 * Delivery reach deals but never leads, while Marketing reads leads and only touches deals for
 * ROI. Reads and writes must therefore be decided per module, not per "CRM".
 *
 * Canon: `docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md`.
 */

export const CRM_LEADS_MODULE = 'CRM_LEADS' as const;

export const CRM_DEALS_MODULE = 'CRM_DEALS' as const;

export const CRM_PERMISSION_MODULES = [CRM_LEADS_MODULE, CRM_DEALS_MODULE] as const;

export type CrmPermissionModule = (typeof CRM_PERMISSION_MODULES)[number];
