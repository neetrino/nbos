import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryChecklistTargetEnum, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CreateDeliveryStageChecklistRuleDto } from './dto/create-delivery-stage-checklist-rule.dto';
import type { UpdateDeliveryStageChecklistRuleDto } from './dto/update-delivery-stage-checklist-rule.dto';

@Injectable()
export class DeliveryStageChecklistRulesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  findAll() {
    return this.prisma.deliveryStageChecklistRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        checklistTemplate: {
          select: { id: true, name: true, status: true, activeVersionId: true },
        },
      },
    });
  }

  private assertFiltersMatchTarget(body: CreateDeliveryStageChecklistRuleDto) {
    if (body.target === DeliveryChecklistTargetEnum.PRODUCT && body.filterExtensionSize != null) {
      throw new BadRequestException('filterExtensionSize is only valid for EXTENSION rules');
    }
    if (
      body.target === DeliveryChecklistTargetEnum.EXTENSION &&
      (body.filterProductCategory != null || body.filterProductType != null)
    ) {
      throw new BadRequestException('Product filters are only valid for PRODUCT rules');
    }
  }

  async create(body: CreateDeliveryStageChecklistRuleDto) {
    this.assertFiltersMatchTarget(body);
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: body.checklistTemplateId },
      select: { id: true, activeVersionId: true },
    });
    if (!template) {
      throw new NotFoundException(`Checklist template ${body.checklistTemplateId} not found`);
    }
    if (!template.activeVersionId) {
      throw new BadRequestException('Template must have a published active version before binding');
    }

    return this.prisma.deliveryStageChecklistRule.create({
      data: {
        target: body.target,
        deliveryStage: body.deliveryStage,
        checklistTemplateId: body.checklistTemplateId,
        priority: body.priority ?? 0,
        filterProductCategory: body.filterProductCategory ?? null,
        filterProductType: body.filterProductType ?? null,
        filterExtensionSize: body.filterExtensionSize ?? null,
        isActive: body.isActive ?? true,
      },
      include: {
        checklistTemplate: { select: { id: true, name: true, status: true } },
      },
    });
  }

  async update(id: string, body: UpdateDeliveryStageChecklistRuleDto) {
    const existing = await this.prisma.deliveryStageChecklistRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Delivery checklist rule ${id} not found`);
    }

    if (body.checklistTemplateId != null) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: body.checklistTemplateId },
        select: { id: true, activeVersionId: true },
      });
      if (!template) {
        throw new NotFoundException(`Checklist template ${body.checklistTemplateId} not found`);
      }
      if (!template.activeVersionId) {
        throw new BadRequestException(
          'Template must have a published active version before binding',
        );
      }
    }

    return this.prisma.deliveryStageChecklistRule.update({
      where: { id },
      data: {
        ...(body.deliveryStage !== undefined && { deliveryStage: body.deliveryStage }),
        ...(body.checklistTemplateId !== undefined && {
          checklistTemplateId: body.checklistTemplateId,
        }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        checklistTemplate: { select: { id: true, name: true, status: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.deliveryStageChecklistRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Delivery checklist rule ${id} not found`);
    }
    await this.prisma.deliveryStageChecklistRule.delete({ where: { id } });
    return { ok: true as const };
  }
}
