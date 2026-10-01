import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, TransactionClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../../common/decorators';
import { allocateProjectCode } from '../../../common/utils/entity-code-series';
import { ensureContactOnProject } from './product-contacts.ops';
import { buildProductCreateTaxonomy } from './product-write-data';
import { parseRegisterProduct, type RegisterProductDto } from './register-product.dto';

/** Validate permissions before any writes, including bundled company creation. */
export function assertRegistrationAccess(data: RegisterProductDto, user: CurrentUserPayload) {
  if (!user.permissions?.PROJECTS_ADD || user.permissions.PROJECTS_ADD === 'NONE')
    throw new ForbiddenException('No permission: PROJECTS.ADD');
  if (
    data.createCompany &&
    (!user.permissions?.CLIENTS_ADD || user.permissions.CLIENTS_ADD === 'NONE')
  ) {
    throw new ForbiddenException('No permission: CLIENTS.ADD');
  }
}

export async function registerProduct(
  prisma: InstanceType<typeof PrismaClient>,
  input: RegisterProductDto,
  user: CurrentUserPayload,
) {
  const data = parseRegisterProduct(input);
  assertRegistrationAccess(data, user);
  const taxonomy = buildProductCreateTaxonomy({ ...data, projectId: data.projectId ?? '' });
  // Reserve codes outside the transaction: concurrent project counters must not stay locked.
  const code = data.createProject ? await allocateProjectCode(prisma) : undefined;
  return prisma.$transaction(async (tx) => {
    await assertActiveContact(tx, data.contactId);
    const existing = data.projectId
      ? await tx.project.findFirst({ where: { id: data.projectId, trashedAt: null } })
      : null;
    if (data.projectId && !existing) throw new NotFoundException('Project not found');
    const companyId = await resolveRegistrationCompany(tx, data, existing?.companyId);
    const project =
      existing ??
      (await tx.project.create({
        data: { name: data.name, code: code!, contactId: data.contactId, companyId },
      }));
    await ensureContactOnProject(tx, project.id, data.contactId);
    return tx.product.create({
      data: {
        name: data.name,
        projectId: project.id,
        contactId: data.contactId,
        companyId,
        ...taxonomy,
        description: data.description,
        deliveryEnabled: data.startDelivery,
        deliveryStage: data.startDelivery ? 'STARTING' : null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
      },
    });
  });
}

async function assertActiveContact(tx: TransactionClient, id: string) {
  const contact = await tx.contact.findFirst({
    where: { id, trashedAt: null },
    select: { id: true },
  });
  if (!contact) throw new NotFoundException('Contact not found');
}

async function resolveRegistrationCompany(
  tx: TransactionClient,
  data: RegisterProductDto,
  inherited?: string | null,
): Promise<string | null> {
  if (data.createCompany) {
    const company = await tx.company.create({
      data: { name: data.name, contactId: data.contactId, taxStatus: data.taxStatus ?? 'TAX' },
    });
    return company.id;
  }
  const id = data.companyId !== undefined ? data.companyId : inherited;
  if (!id) return null;
  const company = await tx.company.findFirst({
    where: { id, trashedAt: null },
    select: { id: true },
  });
  if (!company) throw new NotFoundException('Company not found');
  return company.id;
}
