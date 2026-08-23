import { Injectable, Logger } from '@nestjs/common';
import { automationTaskCreationActor } from '../tasks/task-creation-actors';
import { TaskCreationService } from '../tasks/task-creation.service';
import { TASK_BLUEPRINTS_BY_PRODUCT_TYPE } from './task-blueprints.constants';

/** Event-triggered task generation (blueprint packs live in `task-blueprints.constants.ts`). */
@Injectable()
export class AutoTasksService {
  private readonly logger = new Logger(AutoTasksService.name);

  constructor(private readonly taskCreation: TaskCreationService) {}

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
      await this.taskCreation.create(
        {
          title,
          creatorId: params.creatorId,
          priority: 'NORMAL',
          productId: params.productId,
          links: [{ entityType: params.linkType, entityId: params.linkId }],
        },
        { actor: automationTaskCreationActor(params.linkType, params.linkId) },
      );
      created++;
    }

    this.logger.log(`Created ${created} tasks for ${params.linkType} ${params.linkId}`);
    return { created };
  }

  private getTemplateByProductType(type: string): string[] {
    return TASK_BLUEPRINTS_BY_PRODUCT_TYPE[type] ?? TASK_BLUEPRINTS_BY_PRODUCT_TYPE.OTHER;
  }
}
