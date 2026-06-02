import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, type ProductTeamSlotEnum, type TeamMemberSourceEnum } from '@nbos/database';
import { productSlotBindingsFromRow } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

interface SyncProductSlotsParams {
  productId: string;
  projectId: string;
  row: {
    pmId?: string | null;
    developerId?: string | null;
    designerId?: string | null;
    technicalSpecialistId?: string | null;
    qaLeadId?: string | null;
  };
  actorId?: string;
}

interface SyncExtensionAssigneeParams {
  productId: string;
  projectId: string;
  assignedTo: string | null;
  actorId?: string;
}

const SLOT_SOURCE: TeamMemberSourceEnum = 'PRODUCT_SLOT';
const EXTENSION_SOURCE: TeamMemberSourceEnum = 'EXTENSION_ASSIGNEE';

/**
 * Keeps {@link ProductTeamMember} and {@link ProjectTeamMember} in sync with legacy Product/Extension FK fields.
 */
@Injectable()
export class ProductTeamSyncService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async syncProductSlots(params: SyncProductSlotsParams): Promise<void> {
    const bindings = productSlotBindingsFromRow(params.row);
    const activeEmployeeIds = new Set(bindings.map((b) => b.employeeId));

    await this.prisma.$transaction(async (tx) => {
      const slotMembers = await tx.productTeamMember.findMany({
        where: {
          productId: params.productId,
          source: SLOT_SOURCE,
        },
        select: { id: true, employeeId: true, slot: true },
      });

      for (const member of slotMembers) {
        if (!activeEmployeeIds.has(member.employeeId)) {
          await tx.productTeamMember.delete({ where: { id: member.id } });
        }
      }

      for (const binding of bindings) {
        await tx.productTeamMember.upsert({
          where: {
            productId_employeeId: {
              productId: params.productId,
              employeeId: binding.employeeId,
            },
          },
          create: {
            productId: params.productId,
            employeeId: binding.employeeId,
            slot: binding.slot as ProductTeamSlotEnum,
            source: SLOT_SOURCE,
            isPrimary: true,
            addedById: params.actorId,
          },
          update: {
            slot: binding.slot as ProductTeamSlotEnum,
            source: SLOT_SOURCE,
            isPrimary: true,
            addedById: params.actorId ?? undefined,
          },
        });
        await this.ensureProjectMember(tx, params.projectId, binding.employeeId, params.actorId);
      }
    });
  }

  async syncExtensionAssignee(params: SyncExtensionAssigneeParams): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const extensionRows = await tx.productTeamMember.findMany({
        where: {
          productId: params.productId,
          source: EXTENSION_SOURCE,
        },
        select: { id: true, employeeId: true },
      });

      if (!params.assignedTo) {
        for (const row of extensionRows) {
          await tx.productTeamMember.delete({ where: { id: row.id } });
        }
        return;
      }

      for (const row of extensionRows) {
        if (row.employeeId !== params.assignedTo) {
          await tx.productTeamMember.delete({ where: { id: row.id } });
        }
      }

      const assigneeMember = await tx.productTeamMember.findUnique({
        where: {
          productId_employeeId: {
            productId: params.productId,
            employeeId: params.assignedTo,
          },
        },
        select: { source: true },
      });
      if (!assigneeMember) {
        await tx.productTeamMember.create({
          data: {
            productId: params.productId,
            employeeId: params.assignedTo,
            slot: 'CONTRIBUTOR',
            source: EXTENSION_SOURCE,
            isPrimary: false,
            addedById: params.actorId,
          },
        });
      } else if (assigneeMember.source === EXTENSION_SOURCE) {
        await tx.productTeamMember.update({
          where: {
            productId_employeeId: {
              productId: params.productId,
              employeeId: params.assignedTo,
            },
          },
          data: { addedById: params.actorId ?? undefined },
        });
      }
      await this.ensureProjectMember(tx, params.projectId, params.assignedTo, params.actorId);
    });
  }

  private async ensureProjectMember(
    tx: Pick<InstanceType<typeof PrismaClient>, 'projectTeamMember'>,
    projectId: string,
    employeeId: string,
    actorId?: string,
  ): Promise<void> {
    await tx.projectTeamMember.upsert({
      where: {
        projectId_employeeId: { projectId, employeeId },
      },
      create: {
        projectId,
        employeeId,
        role: 'MEMBER',
        source: 'PRODUCT_SLOT',
        addedById: actorId,
      },
      update: {},
    });
  }
}
