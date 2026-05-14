import {
  CRM_OPEN_DEAL_QUERY,
  CRM_OPEN_LEAD_QUERY,
} from '@/features/crm/constants/crm-list-sheet-url';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { DELIVERY_BOARD_OPEN_ITEM_QUERY } from '@/features/projects/constants/delivery-board-open-query';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import { TASK_OPEN_QUERY } from '@/features/tasks/constants/task-open-query';

/** Matches `openId` on `/clients/companies` and `/clients/contacts` list pages. */
const CLIENTS_LIST_OPEN_ID_QUERY = 'openId';

/** Minimal link fields used to resolve cross-entity routes (e.g. Product under Project). */
export type DriveFileLinkNavInput = {
  entityType: string;
  entityId: string;
  isPrimary?: boolean;
};

function resolveProjectIdFromSiblingLinks(links: readonly DriveFileLinkNavInput[]): string | null {
  const projects = links.filter((l) => l.entityType === 'PROJECT' && l.entityId.trim());
  const first = projects[0];
  if (!first) return null;
  const primary = projects.find((l) => l.isPrimary === true);
  return (primary ?? first).entityId.trim();
}

function deliveryBoardProductHref(productId: string): string {
  const q = new URLSearchParams({
    [DELIVERY_BOARD_OPEN_ITEM_QUERY]: `product-${productId.trim()}`,
  });
  return `/delivery-board?${q.toString()}`;
}

function deliveryBoardExtensionHref(extensionId: string): string {
  const q = new URLSearchParams({
    [DELIVERY_BOARD_OPEN_ITEM_QUERY]: `extension-${extensionId.trim()}`,
  });
  return `/delivery-board?${q.toString()}`;
}

/**
 * Returns an in-app href to open the linked CRM / project / task entity, or `null` when
 * the web app has no stable deep link for that type.
 *
 * Pass all active links on the same file as `siblingLinks` so PRODUCT can open the project
 * product page when a PROJECT link is present.
 */
export function getDriveFileLinkEntityHref(
  link: DriveFileLinkNavInput,
  siblingLinks?: readonly DriveFileLinkNavInput[],
): string | null {
  const id = link.entityId.trim();
  if (!id) return null;

  const projectIdFromSiblings =
    siblingLinks && link.entityType !== 'PROJECT'
      ? resolveProjectIdFromSiblingLinks(siblingLinks)
      : null;

  switch (link.entityType) {
    case 'PROJECT':
      return `/projects/${encodeURIComponent(id)}`;
    case 'PRODUCT':
      if (projectIdFromSiblings) {
        return `/projects/${encodeURIComponent(projectIdFromSiblings)}/products/${encodeURIComponent(id)}`;
      }
      return deliveryBoardProductHref(id);
    case 'EXTENSION':
      return deliveryBoardExtensionHref(id);
    case 'DEAL': {
      const q = new URLSearchParams({ [CRM_OPEN_DEAL_QUERY]: id });
      return `/crm/deals?${q.toString()}`;
    }
    case 'LEAD': {
      const q = new URLSearchParams({ [CRM_OPEN_LEAD_QUERY]: id });
      return `/crm/leads?${q.toString()}`;
    }
    case 'TASK': {
      const q = new URLSearchParams({ [TASK_OPEN_QUERY]: id });
      return `/tasks?${q.toString()}`;
    }
    case 'SUPPORT_TICKET': {
      const q = new URLSearchParams({ [SUPPORT_TICKET_OPEN_QUERY]: id });
      return `/support?${q.toString()}`;
    }
    case 'WORK_SPACE':
    case 'WORKSPACE':
      return `/work-spaces/${encodeURIComponent(id)}`;
    case 'COMPANY': {
      const q = new URLSearchParams({ [CLIENTS_LIST_OPEN_ID_QUERY]: id });
      return `/clients/companies?${q.toString()}`;
    }
    case 'CONTACT': {
      const q = new URLSearchParams({ [CLIENTS_LIST_OPEN_ID_QUERY]: id });
      return `/clients/contacts?${q.toString()}`;
    }
    case 'PARTNER':
      return `/partners/${encodeURIComponent(id)}`;
    case 'INVOICE': {
      const q = new URLSearchParams({ [OPEN_INVOICE_QUERY]: id });
      return `/finance/invoices?${q.toString()}`;
    }
    case 'EXPENSE':
      return `/finance/expenses/${encodeURIComponent(id)}`;
    case 'PAYMENT':
      return `/finance/payments`;
    case 'REPORT':
      return `/finance/reports`;
    default:
      return null;
  }
}
