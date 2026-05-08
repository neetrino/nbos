import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ChecklistTemplateStatusEnum,
  ChecklistTemplateVersionStatusEnum,
  PrismaClient,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  CHECKLIST_TEMPLATE_MAX_ITEMS,
  checklistItemsToJson,
  normalizeChecklistTemplateItems,
} from './checklist-template-items';
import type { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import type { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import type { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import type { UpdateDraftItemsDto } from './dto/update-draft-items.dto';

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
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

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
    return this.findById(createdId);
  }

  async updateMetadata(id: string, body: UpdateChecklistTemplateDto) {
    if (body.status !== undefined && body.status !== ChecklistTemplateStatusEnum.ARCHIVED) {
      throw new BadRequestException('Only archiving is supported via PATCH status');
    }
    const existing = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Checklist template ${id} not found`);
    }
    if (body.status === ChecklistTemplateStatusEnum.ARCHIVED) {
      if (existing.status === ChecklistTemplateStatusEnum.ARCHIVED) {
        return this.findById(id);
      }
    }
    await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        category: body.category ?? undefined,
        ownerModule: body.ownerModule ?? undefined,
        status: body.status ?? undefined,
      },
    });
    return this.findById(id);
  }

  async updateDraftItems(id: string, body: UpdateDraftItemsDto) {
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

    return this.findById(id);
  }

  async createInstance(templateId: string, body: CreateChecklistInstanceDto) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        activeVersion: true,
      },
    });
    if (!template) {
      throw new NotFoundException(`Checklist template ${templateId} not found`);
    }
    if (!template.activeVersionId || !template.activeVersion) {
      throw new BadRequestException('Template has no published active version');
    }
    return this.prisma.checklistInstance.create({
      data: {
        templateId,
        templateVersionId: template.activeVersionId,
        ownerEntityType: body.ownerEntityType,
        ownerEntityId: body.ownerEntityId,
        snapshotItems: template.activeVersion.items as InputJsonValue,
      },
    });
  }

  listInstances(ownerEntityType: string, ownerEntityId: string) {
    return this.prisma.checklistInstance.findMany({
      where: { ownerEntityType, ownerEntityId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { id: true, name: true } },
        templateVersion: { select: { id: true, versionNumber: true } },
      },
    });
  }
}
