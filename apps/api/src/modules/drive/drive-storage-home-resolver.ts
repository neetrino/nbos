import type { PrismaClient } from '@nbos/database';
import type { FilePurposeEnum } from '@nbos/database';
import { slugifySegment } from './drive-storage-slug';
import { purposeSubfolder } from './drive-storage-home-purpose';

type PrismaLike = Pick<
  InstanceType<typeof PrismaClient>,
  | 'deal'
  | 'project'
  | 'product'
  | 'extension'
  | 'task'
  | 'workSpace'
  | 'company'
  | 'contact'
  | 'supportTicket'
  | 'driveFolder'
>;

function normalizeEntityType(entityType: string): string {
  const upper = entityType.trim().toUpperCase();
  return upper === 'WORK_SPACE' ? 'WORKSPACE' : upper;
}

function entityFallback(type: string, entityId: string): string {
  return `misc/${type.toLowerCase()}/${entityId.slice(0, 8)}`;
}

async function resolveDealPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const deal = await prisma.deal.findUnique({
    where: { id: entityId },
    select: { code: true, name: true },
  });
  if (!deal) return entityFallback('DEAL', entityId);
  const slug = slugifySegment(deal.name?.trim() || deal.code);
  return `crm/deals/deal-${deal.code}-${slug}`;
}

async function resolveProjectPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: entityId },
    select: { code: true, name: true },
  });
  if (!project) return entityFallback('PROJECT', entityId);
  const slug = slugifySegment(project.name);
  return `projects/project-${project.code}-${slug}/_project`;
}

async function resolveProductPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: entityId },
    select: {
      name: true,
      project: { select: { code: true, name: true } },
    },
  });
  if (!product?.project) return entityFallback('PRODUCT', entityId);
  const projectSlug = slugifySegment(product.project.name);
  const productSlug = slugifySegment(product.name);
  return `projects/project-${product.project.code}-${projectSlug}/product-${productSlug}-${entityId.slice(0, 8)}`;
}

async function resolveExtensionPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const extension = await prisma.extension.findUnique({
    where: { id: entityId },
    select: {
      name: true,
      project: { select: { code: true, name: true } },
    },
  });
  if (!extension?.project) return entityFallback('EXTENSION', entityId);
  const projectSlug = slugifySegment(extension.project.name);
  const extSlug = slugifySegment(extension.name);
  return `projects/project-${extension.project.code}-${projectSlug}/extension-${extSlug}-${entityId.slice(0, 8)}`;
}

async function resolveTaskPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: entityId },
    select: { code: true },
  });
  if (!task) return entityFallback('TASK', entityId);
  return `tasks/task-${task.code}`;
}

async function resolveWorkspacePath(prisma: PrismaLike, entityId: string): Promise<string> {
  const ws = await prisma.workSpace.findUnique({
    where: { id: entityId },
    select: { name: true },
  });
  if (!ws) return entityFallback('WORKSPACE', entityId);
  const slug = slugifySegment(ws.name);
  return `workspaces/workspace-${entityId.slice(0, 8)}-${slug}`;
}

async function resolveCompanyPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: entityId },
    select: { name: true },
  });
  if (!company) return entityFallback('COMPANY', entityId);
  return `clients/company-${entityId.slice(0, 8)}-${slugifySegment(company.name)}`;
}

async function resolveContactPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const contact = await prisma.contact.findUnique({
    where: { id: entityId },
    select: { firstName: true, lastName: true },
  });
  if (!contact) return entityFallback('CONTACT', entityId);
  const label = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'contact';
  return `clients/contact-${entityId.slice(0, 8)}-${slugifySegment(label)}`;
}

async function resolveSupportPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: entityId },
    select: { code: true },
  });
  if (!ticket) return entityFallback('SUPPORT_TICKET', entityId);
  return `support/ticket-${ticket.code}`;
}

async function resolveDriveFolderPath(prisma: PrismaLike, entityId: string): Promise<string> {
  const folder = await prisma.driveFolder.findUnique({
    where: { id: entityId },
    select: { space: true, ownerId: true, scopeEntityType: true, scopeEntityId: true },
  });
  if (!folder) return 'company-library/uploads';
  if (folder.scopeEntityType && folder.scopeEntityId) {
    return resolveStorageHomeContextPath(prisma, folder.scopeEntityType, folder.scopeEntityId);
  }
  if (folder.space === 'PERSONAL' && folder.ownerId) {
    return `personal/${folder.ownerId}`;
  }
  return 'company-library/uploads';
}

/**
 * Relative path under `nbos/tenants/{organizationId}/files/` (no leading slash).
 */
export async function resolveStorageHomeContextPath(
  prisma: PrismaLike,
  entityType: string,
  entityId: string,
): Promise<string> {
  const type = normalizeEntityType(entityType);
  switch (type) {
    case 'DEAL':
      return resolveDealPath(prisma, entityId);
    case 'PROJECT':
      return resolveProjectPath(prisma, entityId);
    case 'PRODUCT':
      return resolveProductPath(prisma, entityId);
    case 'EXTENSION':
      return resolveExtensionPath(prisma, entityId);
    case 'TASK':
      return resolveTaskPath(prisma, entityId);
    case 'WORKSPACE':
      return resolveWorkspacePath(prisma, entityId);
    case 'COMPANY':
      return resolveCompanyPath(prisma, entityId);
    case 'CONTACT':
      return resolveContactPath(prisma, entityId);
    case 'SUPPORT_TICKET':
      return resolveSupportPath(prisma, entityId);
    case 'DRIVE_FOLDER':
      return resolveDriveFolderPath(prisma, entityId);
    case 'DOCUMENT':
      return `company-library/documents/${entityId.slice(0, 8)}`;
    default:
      return entityFallback(type, entityId);
  }
}

export async function resolveStorageHomeContextWithPurpose(
  prisma: PrismaLike,
  entityType: string,
  entityId: string,
  purpose: FilePurposeEnum | null | undefined,
): Promise<string> {
  const base = await resolveStorageHomeContextPath(prisma, entityType, entityId);
  const sub = purposeSubfolder(purpose);
  return `${base}/${sub}`;
}
