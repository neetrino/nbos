import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ChecklistTemplateStatusEnum,
  ChecklistTemplateVersionStatusEnum,
  PrismaClient,
  type DeliveryStageEnum,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
  ChecklistTemplateAuditAction,
} from './checklist-template-audit.constants';
import {
  CHECKLIST_TEMPLATE_MAX_ITEMS,
  checklistItemsToJson,
  normalizeChecklistTemplateItems,
} from './checklist-template-items';
import type { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import type { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import type { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import type { UpdateDraftItemsDto } from './dto/update-draft-items.dto';
import type { UpdateChecklistInstanceItemDto } from './dto/update-checklist-instance-item.dto';

const templateInclude = {
  activeVersion: {
    select: { id: true, versionNumber: true, status: true, createdAt: true },
  },
  versions: {
    orderBy: { versionNumber: 'desc' as const },
    select: {
      id: true,
      versionNumber: true,
      status: true,
      createdAt: true,
      createdById: true,
    },
  },
};

@Injectable()
export class ChecklistTemplatesService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.checklistTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        activeVersion: {
          select: { id: true, versionNumber: true, status: true },
        },
      },
    });
  }

  async findById(id: string) {
    const row = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        ...templateInclude,
      },
    });
    if (!row) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    const draftVersion = await this.prisma.checklistTemplateVersion.findFirst({
      where: { templateId: id, status: ChecklistTemplateVersionStatusEnum.DRAFT },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        items: true,
        createdAt: true,
      },
    });
    return { ...row, draftVersion };
  }

  async create(body: CreateChecklistTemplateDto, actorEmployeeId: string) {
    let createdId = '';
    await this.prisma.$transaction(async (tx) => {
      const template = await tx.checklistTemplate.create({
        data: {
          name: body.name,
          description: body.description ?? null,
          category: body.category,
          ownerModule: body.ownerModule,
          status: ChecklistTemplateStatusEnum.DRAFT,
        },
      });
      createdId = template.id;
      await tx.checklistTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: 1,
          status: ChecklistTemplateVersionStatusEnum.DRAFT,
          items: [],
          createdById: actorEmployeeId,
        },
      });
    });
    await this.audit.log({
      entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
      entityId: createdId,
      action: ChecklistTemplateAuditAction.CREATED,
      userId: actorEmployeeId,
      changes: { name: body.name } as InputJsonValue,
    });
    return this.findById(createdId);
  }

  async updateMetadata(id: string, body: UpdateChecklistTemplateDto, actorEmployeeId: string) {
    const existing = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        category: body.category ?? undefined,
        ownerModule: body.ownerModule ?? undefined,
      },
    });
    const changedKeys = (Object.keys(body) as Array<keyof UpdateChecklistTemplateDto>).filter(
      (key) => body[key] !== undefined,
    );
    if (changedKeys.length > 0) {
      await this.audit.log({
        entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
        entityId: id,
        action: ChecklistTemplateAuditAction.METADATA_UPDATED,
        userId: actorEmployeeId,
        changes: { fields: changedKeys } as InputJsonValue,
      });
    }
    return this.findById(id);
  }

  async archive(id: string, actorEmployeeId: string) {
    const existing = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    if (existing.status === ChecklistTemplateStatusEnum.ARCHIVED) {
      return this.findById(id);
    }
    await this.prisma.checklistTemplate.update({
      where: { id },
      data: { status: ChecklistTemplateStatusEnum.ARCHIVED },
    });
    await this.audit.log({
      entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
      entityId: id,
      action: ChecklistTemplateAuditAction.ARCHIVED,
      userId: actorEmployeeId,
    });
    return this.findById(id);
  }

  async updateDraftItems(id: string, body: UpdateDraftItemsDto, actorEmployeeId: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    if (template.status === ChecklistTemplateStatusEnum.ARCHIVED) {
      throw new BadRequestException('Archived templates cannot be edited');
    }
    if (body.items.length > CHECKLIST_TEMPLATE_MAX_ITEMS) {
      throw new BadRequestException(`At most ${CHECKLIST_TEMPLATE_MAX_ITEMS} items`);
    }
    const draft = await this.prisma.checklistTemplateVersion.findFirst({
      where: { templateId: id, status: ChecklistTemplateVersionStatusEnum.DRAFT },
      orderBy: { versionNumber: 'desc' },
    });
    if (!draft) {
      throw new BadRequestException('No draft version available');
    }
    const normalized = normalizeChecklistTemplateItems(body.items);
    await this.prisma.checklistTemplateVersion.update({
      where: { id: draft.id },
      data: { items: checklistItemsToJson(normalized) },
    });
    await this.audit.log({
      entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
      entityId: id,
      action: ChecklistTemplateAuditAction.DRAFT_UPDATED,
      userId: actorEmployeeId,
      changes: {
        draftVersionId: draft.id,
        itemCount: normalized.length,
      } as InputJsonValue,
    });
    return this.findById(id);
  }

  async publish(id: string, actorEmployeeId: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    if (template.status === ChecklistTemplateStatusEnum.ARCHIVED) {
      throw new BadRequestException('Archived templates cannot be published');
    }
    const draft = await this.prisma.checklistTemplateVersion.findFirst({
      where: { templateId: id, status: ChecklistTemplateVersionStatusEnum.DRAFT },
      orderBy: { versionNumber: 'desc' },
    });
    if (!draft) {
      throw new BadRequestException('No draft version to publish');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.checklistTemplateVersion.update({
        where: { id: draft.id },
        data: { status: ChecklistTemplateVersionStatusEnum.PUBLISHED },
      });
      await tx.checklistTemplate.update({
        where: { id },
        data: {
          activeVersionId: draft.id,
          status: ChecklistTemplateStatusEnum.ACTIVE,
        },
      });
      const agg = await tx.checklistTemplateVersion.aggregate({
        where: { templateId: id },
        _max: { versionNumber: true },
      });
      const nextNum = (agg._max.versionNumber ?? 0) + 1;
      await tx.checklistTemplateVersion.create({
        data: {
          templateId: id,
          versionNumber: nextNum,
          status: ChecklistTemplateVersionStatusEnum.DRAFT,
          items: draft.items as InputJsonValue,
          createdById: actorEmployeeId,
        },
      });
    });

    await this.audit.log({
      entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
      entityId: id,
      action: ChecklistTemplateAuditAction.VERSION_PUBLISHED,
      userId: actorEmployeeId,
      changes: {
        publishedVersionId: draft.id,
        publishedVersionNumber: draft.versionNumber,
      } as InputJsonValue,
    });
    return this.findById(id);
  }

  async getVersionSnapshot(templateId: string, versionId: string) {
    const row = await this.prisma.checklistTemplateVersion.findFirst({
      where: { id: versionId, templateId },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        createdAt: true,
        items: true,
      },
    });
    if (!row) {
      throw new NotFoundException(`Checklist template version ${versionId} not found`);
    }
    return row;
  }

  async duplicateFrom(sourceId: string, actorEmployeeId: string) {
    const source = await this.prisma.checklistTemplate.findUnique({
      where: { id: sourceId },
      include: {
        activeVersion: { select: { items: true } },
      },
    });
    if (!source) {
      throw new NotFoundException(`Checklist template ${sourceId} not found`);
    }
    const sourceDraft = await this.prisma.checklistTemplateVersion.findFirst({
      where: { templateId: sourceId, status: ChecklistTemplateVersionStatusEnum.DRAFT },
      orderBy: { versionNumber: 'desc' },
      select: { items: true },
    });
    const rawItems =
      sourceDraft?.items ?? source.activeVersion?.items ?? ([] as unknown as InputJsonValue);
    const name = `Copy of ${source.name}`;
    let createdId = '';
    await this.prisma.$transaction(async (tx) => {
      const template = await tx.checklistTemplate.create({
        data: {
          name,
          description: source.description,
          category: source.category,
          ownerModule: source.ownerModule,
          status: ChecklistTemplateStatusEnum.DRAFT,
        },
      });
      createdId = template.id;
      await tx.checklistTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: 1,
          status: ChecklistTemplateVersionStatusEnum.DRAFT,
          items: rawItems as InputJsonValue,
          createdById: actorEmployeeId,
        },
      });
    });
    await this.audit.log({
      entityType: CHECKLIST_TEMPLATE_AUDIT_ENTITY_TYPE,
      entityId: createdId,
      action: ChecklistTemplateAuditAction.DUPLICATED,
      userId: actorEmployeeId,
      changes: { sourceTemplateId: sourceId } as InputJsonValue,
    });
    return this.findById(createdId);
  }

  async createInstance(templateId: string, body: CreateChecklistInstanceDto) {
    return this.createInstanceFromActiveVersion({
      templateId,
      ownerEntityType: body.ownerEntityType,
      ownerEntityId: body.ownerEntityId,
    });
  }

  /**
   * Creates an instance from the template active (published) version.
   * When `deliveryStage` is set, skips if an instance already exists for the same owner + template + stage.
   */
  async createInstanceFromActiveVersion(input: {
    templateId: string;
    ownerEntityType: string;
    ownerEntityId: string;
    deliveryStage?: DeliveryStageEnum;
  }) {
    if (input.deliveryStage != null) {
      const existing = await this.prisma.checklistInstance.findFirst({
        where: {
          templateId: input.templateId,
          ownerEntityType: input.ownerEntityType,
          ownerEntityId: input.ownerEntityId,
          deliveryStage: input.deliveryStage,
        },
      });
      if (existing) {
        return existing;
      }
    }

    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: input.templateId },
      include: { activeVersion: true },
    });
    if (!template) {
      throw new NotFoundException(`Checklist template ${input.templateId} not found`);
    }
    if (!template.activeVersionId || !template.activeVersion) {
      throw new BadRequestException('Template has no published active version');
    }
    return this.prisma.checklistInstance.create({
      data: {
        templateId: input.templateId,
        templateVersionId: template.activeVersionId,
        ownerEntityType: input.ownerEntityType,
        ownerEntityId: input.ownerEntityId,
        deliveryStage: input.deliveryStage ?? null,
        snapshotItems: template.activeVersion.items as InputJsonValue,
      },
    });
  }

  listInstances(ownerEntityType: string, ownerEntityId: string) {
    return this.prisma.checklistInstance.findMany({
      where: { ownerEntityType, ownerEntityId },
      orderBy: [{ deliveryStage: 'asc' }, { createdAt: 'desc' }],
      include: {
        template: { select: { id: true, name: true } },
        templateVersion: { select: { id: true, versionNumber: true } },
        completedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async assertStageInstancesCompleted(input: {
    ownerEntityType: 'PRODUCT' | 'EXTENSION';
    ownerEntityId: string;
    deliveryStage: DeliveryStageEnum;
  }) {
    const instances = await this.prisma.checklistInstance.findMany({
      where: {
        ownerEntityType: input.ownerEntityType,
        ownerEntityId: input.ownerEntityId,
        deliveryStage: input.deliveryStage,
      },
      select: {
        id: true,
        completedAt: true,
        template: { select: { name: true } },
      },
    });
    const incomplete = instances.filter((instance) => !instance.completedAt);
    if (incomplete.length === 0) return;

    throw new BadRequestException({
      statusCode: 400,
      code: 'STAGE_GATE_VALIDATION',
      message: 'Stage checklist must be completed before moving to the next stage.',
      errors: incomplete.map((instance) => ({
        field: `checklist.${instance.id}`,
        message: `${instance.template.name} must be completed.`,
      })),
    });
  }

  async updateInstanceItem(instanceId: string, body: UpdateChecklistInstanceItemDto) {
    const instance = await this.prisma.checklistInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Checklist instance ${instanceId} not found`);
    }
    if (instance.completedAt) {
      throw new BadRequestException('Completed checklist instances cannot be edited');
    }

    const items = normalizeInstanceSnapshotItems(instance.snapshotItems);
    const index = items.findIndex((item) => item.id === body.itemId);
    if (index < 0) {
      throw new NotFoundException(`Checklist item ${body.itemId} not found`);
    }

    const comment = body.comment?.trim() ?? '';
    if (body.mark === 'NOT_DONE' && comment.length === 0) {
      throw new BadRequestException('Not Done checklist items require a comment');
    }

    items[index] = {
      ...items[index],
      mark: body.mark === 'PENDING' ? undefined : body.mark,
      comment: comment.length > 0 ? comment : undefined,
    };

    return this.prisma.checklistInstance.update({
      where: { id: instanceId },
      data: { snapshotItems: items as unknown as InputJsonValue },
      include: {
        template: { select: { id: true, name: true } },
        templateVersion: { select: { id: true, versionNumber: true } },
        completedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async completeInstance(instanceId: string, actorEmployeeId: string) {
    const instance = await this.prisma.checklistInstance.findUnique({ where: { id: instanceId } });
    if (!instance) {
      throw new NotFoundException(`Checklist instance ${instanceId} not found`);
    }
    if (instance.completedAt) {
      return this.prisma.checklistInstance.findUnique({
        where: { id: instanceId },
        include: {
          template: { select: { id: true, name: true } },
          templateVersion: { select: { id: true, versionNumber: true } },
          completedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    const errors = validateChecklistInstanceCompletion(instance.snapshotItems);
    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'CHECKLIST_INSTANCE_VALIDATION',
        message: 'Checklist cannot be completed until required decisions are reviewed.',
        errors,
      });
    }

    const updated = await this.prisma.checklistInstance.update({
      where: { id: instanceId },
      data: { completedAt: new Date(), completedById: actorEmployeeId },
      include: {
        template: { select: { id: true, name: true } },
        templateVersion: { select: { id: true, versionNumber: true } },
        completedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      entityType: 'CHECKLIST_INSTANCE',
      entityId: instanceId,
      action: ChecklistTemplateAuditAction.INSTANCE_COMPLETED,
      userId: actorEmployeeId,
      changes: {
        ownerEntityType: instance.ownerEntityType,
        ownerEntityId: instance.ownerEntityId,
        deliveryStage: instance.deliveryStage,
      } as InputJsonValue,
    });
    return updated;
  }
}

type ChecklistInstanceMark = 'DONE' | 'NOT_DONE';

interface ChecklistInstanceSnapshotItem {
  id: string;
  title: string;
  instruction?: string;
  decisionRequired?: boolean;
  sortOrder?: number;
  mark?: ChecklistInstanceMark;
  comment?: string;
}

function normalizeInstanceSnapshotItems(raw: unknown): ChecklistInstanceSnapshotItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row, index): ChecklistInstanceSnapshotItem | null => {
      if (!row || typeof row !== 'object') return null;
      const item = row as Record<string, unknown>;
      const id = typeof item.id === 'string' ? item.id : '';
      const title = typeof item.title === 'string' ? item.title : '';
      if (!id || !title) return null;
      const mark = item.mark === 'DONE' || item.mark === 'NOT_DONE' ? item.mark : undefined;
      const comment = typeof item.comment === 'string' ? item.comment : undefined;
      return {
        id,
        title,
        instruction: typeof item.instruction === 'string' ? item.instruction : '',
        decisionRequired: item.decisionRequired === true,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        mark,
        comment,
      };
    })
    .filter((item): item is ChecklistInstanceSnapshotItem => item !== null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function validateChecklistInstanceCompletion(snapshotItems: unknown) {
  const items = normalizeInstanceSnapshotItems(snapshotItems);
  const errors: Array<{ field: string; message: string }> = [];

  for (const item of items) {
    if (item.decisionRequired && item.mark !== 'DONE' && item.mark !== 'NOT_DONE') {
      errors.push({
        field: `items.${item.id}`,
        message: `${item.title} must be reviewed before completing the checklist.`,
      });
    }
    if (item.mark === 'NOT_DONE' && !item.comment?.trim()) {
      errors.push({
        field: `items.${item.id}.comment`,
        message: `${item.title} needs a comment when marked Not Done.`,
      });
    }
  }

  return errors;
}
