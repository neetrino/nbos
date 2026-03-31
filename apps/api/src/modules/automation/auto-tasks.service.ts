import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

/**
 * Ключи совпадают с ProductTypeEnum в Prisma schema.
 * Типы без собственного шаблона используют fallback → OTHER.
 */
const TASK_TEMPLATES: Record<string, string[]> = {
  WEBSITE: [
    'Setup project repo',
    'UI/UX design',
    'Frontend development',
    'Backend development',
    'Testing & QA',
    'Deployment & DNS',
    'Client handover',
  ],
  WEB_APP: [
    'Setup project repo',
    'UI/UX design',
    'Frontend development',
    'Backend development',
    'API integration',
    'Testing & QA',
    'Deployment',
    'Client handover',
  ],
  MOBILE_APP: [
    'Setup project repo',
    'UI/UX design',
    'Mobile development',
    'API integration',
    'App store setup',
    'Testing & QA',
    'Release',
    'Client handover',
  ],
  CRM: [
    'Requirements analysis',
    'Database schema',
    'Backend development',
    'Frontend UI',
    'Integration testing',
    'Data migration',
    'UAT',
    'Deployment',
  ],
  ECOMMERCE: [
    'Requirements analysis',
    'UI/UX design',
    'Product catalog setup',
    'Payment integration',
    'Frontend development',
    'Backend development',
    'Testing & QA',
    'Deployment',
    'Client handover',
  ],
  SAAS: [
    'Setup project repo',
    'Architecture design',
    'UI/UX design',
    'Frontend development',
    'Backend development',
    'API integration',
    'Auth & billing setup',
    'Testing & QA',
    'Deployment',
    'Client handover',
  ],
  LANDING: [
    'Content & copy',
    'UI/UX design',
    'Frontend development',
    'Testing & QA',
    'Deployment & DNS',
    'Client handover',
  ],
  ERP: [
    'Requirements analysis',
    'Database schema',
    'Backend development',
    'Frontend UI',
    'Integration testing',
    'Data migration',
    'UAT',
    'Deployment',
  ],
  LOGO: [
    'Client brief',
    'Mood board & concepts',
    'Design iterations',
    'Final deliverables',
    'Client handover',
  ],
  SMM: [
    'Strategy & content plan',
    'Visual content creation',
    'Account setup',
    'Launch & monitoring',
    'Monthly report',
  ],
  SEO: [
    'Technical audit',
    'Keyword research',
    'On-page optimization',
    'Content plan',
    'Link building',
    'Monthly report',
  ],
  OTHER: ['Requirements', 'Development', 'Testing', 'Delivery'],
};

@Injectable()
export class AutoTasksService {
  private readonly logger = new Logger(AutoTasksService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /**
   * Генерирует задачи для Deal на основе productType.
   * При необходимости привязывает через TaskLink к указанному entityType/entityId.
   */
  async generateTasksForDeal(
    dealId: string,
    productType: string,
    creatorId: string,
  ): Promise<{ created: number }> {
    const titles = this.getTemplateByProductType(productType);
    this.logger.log(
      `Generating ${titles.length} tasks for deal ${dealId} (productType=${productType})`,
    );

    let created = 0;
    for (const title of titles) {
      const code = await this.generateCode();
      await this.prisma.task.create({
        data: {
          code,
          title,
          creatorId,
          priority: 'NORMAL',
          links: {
            create: { entityType: 'DEAL', entityId: dealId },
          },
        },
      });
      created++;
    }

    this.logger.log(`Created ${created} tasks for deal ${dealId}`);
    return { created };
  }

  private getTemplateByProductType(type: string): string[] {
    return TASK_TEMPLATES[type] ?? TASK_TEMPLATES.OTHER;
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
