import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface WonDealData {
  id: string;
  code: string;
  name: string | null;
  type: string;
  amount: unknown;
  paymentType: string | null;
  taxStatus: string | null;
  contactId: string;
  companyId: string | null;
  sellerId: string;
  projectId: string | null;
  productCategory: string | null;
  productType: string | null;
  pmId: string | null;
  deadline: Date | null;
  existingProductId: string | null;
  maintenanceStartAt: Date | null;
  source: string | null;
  sourceDetail: string | null;
  sourcePartnerId: string | null;
  sourceContactId: string | null;
  marketingAccountId: string | null;
  marketingActivityId: string | null;
  orders?: Array<{
    invoices?: Array<{
      status: string;
      amount: unknown;
      paidDate?: Date | null;
    }>;
  }>;
}

interface ProductWonResult {
  projectId: string;
  productId: string | null;
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
    } else if (deal.type === 'MAINTENANCE') {
      await this.handleMaintenanceWon(deal);
    }
  }

  private async handleProductWon(deal: WonDealData) {
    const result = await this.ensureProductDeliveryShell(deal);
    await this.createProductSubscriptionIfReady(deal, result.projectId);
    if (result.productId) {
      await this.createMaintenanceDealIfMissing(deal, result.projectId, result.productId);
    }
  }

  private async ensureProductDeliveryShell(deal: WonDealData): Promise<ProductWonResult> {
    const projectId = await this.ensureProject(deal);
    const productId = await this.ensureProduct(deal, projectId);
    return { projectId, productId };
  }

  private async ensureProject(deal: WonDealData): Promise<string> {
    if (deal.projectId) return deal.projectId;

    const projectCode = await this.generateProjectCode();
    const project = await this.prisma.project.create({
      data: {
        code: projectCode,
        name: deal.name ?? `Project from ${deal.code}`,
        contactId: deal.contactId,
        companyId: deal.companyId ?? undefined,
      },
    });

    await this.prisma.deal.update({
      where: { id: deal.id },
      data: { projectId: project.id },
    });

    this.logger.log(`Auto-created project ${projectCode} for deal ${deal.code}`);
    return project.id;
  }

  private async ensureProduct(deal: WonDealData, projectId: string): Promise<string | null> {
    if (!deal.productCategory || !deal.productType) return null;

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
    return product.id;
  }

  private async createProductSubscriptionIfReady(deal: WonDealData, projectId: string) {
    if (deal.paymentType !== 'SUBSCRIPTION') return;

    const firstPaidInvoice = this.getFirstPaidInvoice(deal);
    if (!firstPaidInvoice) return;

    const existing = await this.prisma.subscription.findFirst({
      where: { projectId, type: 'DEV_AND_MAINTENANCE' },
      select: { id: true },
    });
    if (existing) return;

    const startDate = firstPaidInvoice.paidDate ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId,
        type: 'DEV_AND_MAINTENANCE',
        amount: Number(deal.amount ?? firstPaidInvoice.amount),
        billingDay: startDate.getDate(),
        taxStatus: (deal.taxStatus as Prisma.SubscriptionCreateInput['taxStatus']) ?? 'TAX',
        startDate,
        status: 'ACTIVE',
      },
    });
  }

  private async createMaintenanceDealIfMissing(
    deal: WonDealData,
    projectId: string,
    productId: string,
  ) {
    const existing = await this.prisma.deal.findFirst({
      where: { projectId, type: 'MAINTENANCE', existingProductId: productId },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.deal.create({
      data: {
        code: await this.generateDealCode(),
        name: `Maintenance for ${deal.name ?? deal.code}`,
        contactId: deal.contactId,
        companyId: deal.companyId,
        sellerId: deal.sellerId,
        projectId,
        type: 'MAINTENANCE',
        paymentType: 'SUBSCRIPTION',
        taxStatus: (deal.taxStatus as Prisma.DealCreateInput['taxStatus']) ?? 'TAX',
        existingProductId: productId,
        source: deal.source as Prisma.DealCreateInput['source'],
        sourceDetail: deal.sourceDetail,
        sourcePartnerId: deal.sourcePartnerId,
        sourceContactId: deal.sourceContactId,
        marketingAccountId: deal.marketingAccountId,
        marketingActivityId: deal.marketingActivityId,
      },
    });
  }

  private async handleMaintenanceWon(deal: WonDealData) {
    if (!deal.projectId || !deal.amount) {
      this.logger.warn(`Maintenance deal ${deal.code} won without project or amount — skipping`);
      return;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { projectId: deal.projectId, type: 'MAINTENANCE_ONLY' },
      select: { id: true },
    });
    if (existing) return;

    const startDate = deal.maintenanceStartAt ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId: deal.projectId,
        type: 'MAINTENANCE_ONLY',
        amount: Number(deal.amount),
        billingDay: startDate.getDate(),
        taxStatus: (deal.taxStatus as Prisma.SubscriptionCreateInput['taxStatus']) ?? 'TAX',
        startDate,
        status: 'PENDING',
      },
    });
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

  private async generateDealCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `D-${year}-`;
    const last = await this.prisma.deal.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  private async generateSubscriptionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SUB-${year}-`;
    const last = await this.prisma.subscription.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  private getFirstPaidInvoice(deal: WonDealData) {
    const invoices = deal.orders?.flatMap((order) => order.invoices ?? []) ?? [];
    return invoices.find((invoice) => invoice.status === 'PAID') ?? null;
  }
}
