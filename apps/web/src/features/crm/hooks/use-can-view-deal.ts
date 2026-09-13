'use client';

import { CRM_DEALS_MODULE } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';

/**
 * Whether the current employee may open a deal card. Finance, project and delivery screens link to
 * deals for context, but the deal itself stays a CRM record: the matrix decides, not the link. Use
 * this to hide those entry points instead of letting the request fail with 403.
 */
export function useCanViewDeal(): boolean {
  const { can } = usePermission();
  return can('VIEW', CRM_DEALS_MODULE);
}
