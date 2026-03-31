import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface WonDealData {
  id: string;
  code: string;
  name: string | null;
  type: string;
  contactId: string;
  companyId: string | null;
  sellerId: string;
  projectId: string | null;
  productCategory: string | null;
  productType: string | null;
  pmId: string | null;
  deadline: Date | null;
  existingProductId: string | null;
}

@Injectable()
export class DealWonHandler {
  private readonly logger = new Logger(DealWonHandler.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async handle(deal: WonDealData) {
    if (deal.type === 'PRODUCT') {
      await this.handleProductWon(deal);
    } else if (deal.type === 'EXTENSION') {
      await this.handleExtensionWon(deal);
    }
  }

  private async handleProductWon(deal: WonDealData) {
    let projectId = deal.projectId;

    if (!projectId) {
      const projectCode = await this.generateProjectCode();
      const project = await this.prisma.project.create({
        data: {
          code: projectCode,
          name: deal.name ?? `Project from ${deal.code}`,
          contactId: deal.contactId,
          companyId: deal.companyId ?? undefined,
        },
      });
      projectId = project.id;

      await this.prisma.deal.update({
        where: { id: deal.id },
        data: { projectId },
      });

      this.logger.log(`Auto-created project ${projectCode} for deal ${deal.code}`);
    }

    if (deal.productCategory && deal.productType) {
      const product = await this.prisma.product.create({
        data: {
          projectId,
          name: deal.name ?? `Product from ${deal.code}`,
          productCategory: deal.productCategory as Prisma.ProductCreateInput['productCategory'],
          productType: deal.productType as Prisma.ProductCreateInput['productType'],
          pmId: deal.pmId ?? undefined,
          deadline: deal.deadline ?? undefined,
        },
      });
      this.logger.log(
        `Auto-created product ${product.id} (${deal.productCategory}/${deal.productType}) for deal ${deal.code}`,
      );
    }
  }

  private async handleExtensionWon(deal: WonDealData) {
    if (!deal.existingProductId) {
      this.logger.warn(`Extension deal ${deal.code} won but no existingProductId — skipping`);
      return;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: deal.existingProductId },
      select: { id: true, projectId: true },
    });
    if (!product) {
      this.logger.warn(`Extension deal ${deal.code}: product ${deal.existingProductId} not found`);
      return;
    }

    const extension = await this.prisma.extension.create({
      data: {
        projectId: product.projectId,
        productId: product.id,
        name: deal.name ?? `Extension from ${deal.code}`,
        size: 'MEDIUM',
      },
    });

    if (!deal.projectId) {
      await this.prisma.deal.update({
        where: { id: deal.id },
        data: { projectId: product.projectId },
      });
    }

    this.logger.log(
      `Auto-created extension ${extension.id} for product ${product.id} from deal ${deal.code}`,
    );
  }

  private async generateProjectCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `P-${year}-`;
    const last = await this.prisma.project.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }
}
