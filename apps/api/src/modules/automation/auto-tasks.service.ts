import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

type ProductType = 'WEB_APP' | 'MOBILE_APP' | 'DESIGN' | 'ERP_MODULE' | 'INTEGRATION' | 'OTHER';

const TASK_TEMPLATES: Record<ProductType, string[]> = {
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
  DESIGN: [
    'Client brief',
    'Mood board & concepts',
    'Design iterations',
    'Final deliverables',
    'Client handover',
  ],
  ERP_MODULE: [
    'Requirements analysis',
    'Database schema',
    'Backend development',
    'Frontend UI',
    'Integration testing',
    'Data migration',
    'UAT',
    'Deployment',
  ],
  INTEGRATION: ['API analysis', 'Technical design', 'Development', 'Testing', 'Deployment'],
  OTHER: ['Requirements', 'Development', 'Testing', 'Delivery'],
};

@Injectable()
export class AutoTasksService {
  private readonly logger = new Logger(AutoTasksService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /** Ստեղծում է task-եր delays product-ի տիպի template- delays */
  async generateTasksForProduct(
    productId: string,
    creatorId: string,
  ): Promise<{ created: number }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true, productType: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const titles = this.getTemplateByProductType(product.productType);
    this.logger.log(
      `Generating ${titles.length} tasks for product "${product.name}" (${product.productType})`,
    );

    let created = 0;
    for (const title of titles) {
      const code = await this.generateCode();
      await this.prisma.task.create({
        data: {
          code,
          title,
          projectId: product.projectId,
          productId: product.id,
          creatorId,
          priority: 'MEDIUM' as Prisma.TaskCreateInput['priority'],
        },
      });
      created++;
    }

    this.logger.log(`Created ${created} tasks for product ${product.name}`);
    return { created };
  }

  private getTemplateByProductType(type: string): string[] {
    return TASK_TEMPLATES[type as ProductType] ?? TASK_TEMPLATES.OTHER;
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
