import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { TASK_BLUEPRINTS_BY_PRODUCT_TYPE } from './task-blueprints.constants';

/** Event-triggered task generation (blueprint packs live in `task-blueprints.constants.ts`). */
@Injectable()
export class AutoTasksService {
  private readonly logger = new Logger(AutoTasksService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /**
   * Генерирует задачи для Deal на основе productType.
   * Привязывает через TaskLink к DEAL.
   */
  async generateTasksForDeal(
    dealId: string,
    productType: string,
    creatorId: string,
  ): Promise<{ created: number }> {
    return this.generateTasks({
      productType,
      creatorId,
      linkType: 'DEAL',
      linkId: dealId,
    });
  }

  /**
   * Генерирует задачи для Product на основе его productType.
   * Привязывает через TaskLink к PRODUCT и через FK productId.
   */
  async generateTasksForProduct(
    productId: string,
    productType: string,
    creatorId: string,
  ): Promise<{ created: number }> {
    return this.generateTasks({
      productType,
      creatorId,
      linkType: 'PRODUCT',
      linkId: productId,
      productId,
    });
  }

  private async generateTasks(params: {
    productType: string;
    creatorId: string;
    linkType: string;
    linkId: string;
    productId?: string;
  }): Promise<{ created: number }> {
    const titles = this.getTemplateByProductType(params.productType);
    this.logger.log(
      `Generating ${titles.length} tasks for ${params.linkType} ${params.linkId} (productType=${params.productType})`,
    );

    let created = 0;
    for (const title of titles) {
      const code = await this.generateCode();
      await this.prisma.task.create({
        data: {
          code,
          title,
          creatorId: params.creatorId,
          priority: 'NORMAL',
          productId: params.productId,
          links: {
            create: { entityType: params.linkType, entityId: params.linkId },
          },
        },
      });
      created++;
    }

    this.logger.log(`Created ${created} tasks for ${params.linkType} ${params.linkId}`);
    return { created };
  }

  private getTemplateByProductType(type: string): string[] {
    return TASK_BLUEPRINTS_BY_PRODUCT_TYPE[type] ?? TASK_BLUEPRINTS_BY_PRODUCT_TYPE.OTHER;
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `T-${year}-`;
    const last = await this.prisma.task.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
