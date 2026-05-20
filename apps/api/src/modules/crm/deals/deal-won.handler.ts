import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveDealWonLinksService } from '../../drive/drive-deal-won-links.service';
import type { DealWonDriveLinkTargets } from '../../drive/drive-deal-won-links.types';

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
      moneyStatus: string;
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

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly driveDealWonLinks: DriveDealWonLinksService,
  ) {}

  async handle(deal: WonDealData) {
    const targets = await this.resolveWonTargets(deal);
    if (targets) {
      await this.driveDealWonLinks.linkApprovedDealMaterials(targets);
    }
  }

  private async resolveWonTargets(deal: WonDealData): Promise<DealWonDriveLinkTargets | null> {
    if (deal.type === 'PRODUCT') {
      return this.targetsAfterProductWon(deal);
    }
    if (deal.type === 'EXTENSION') {
      return this.targetsAfterExtensionWon(deal);
    }
    if (deal.type === 'MAINTENANCE') {
      return this.targetsAfterMaintenanceWon(deal);
    }
    return this.targetsFromExistingProject(deal);
  }

  private async targetsAfterProductWon(deal: WonDealData): Promise<DealWonDriveLinkTargets> {
    const result = await this.ensureProductDeliveryShell(deal);
    await this.createProductSubscriptionIfReady(deal, result.projectId);
    if (result.productId) {
      await this.createMaintenanceDealIfMissing(deal, result.projectId, result.productId);
    }
    return this.toLinkTargets(deal, result.projectId, result.productId);
  }

  private async targetsAfterExtensionWon(
    deal: WonDealData,
  ): Promise<DealWonDriveLinkTargets | null> {
    const extensionId = await this.handleExtensionWon(deal);
    if (!extensionId) return null;
    const product = await this.prisma.product.findUnique({
      where: { id: deal.existingProductId! },
      select: { id: true, projectId: true },
    });
    if (!product) return null;
    return this.toLinkTargets(deal, product.projectId, product.id, extensionId);
  }

  private async targetsAfterMaintenanceWon(
    deal: WonDealData,
  ): Promise<DealWonDriveLinkTargets | null> {
    return this.runMaintenanceWon(deal);
  }

  private async targetsFromExistingProject(
    deal: WonDealData,
  ): Promise<DealWonDriveLinkTargets | null> {
    if (!deal.projectId) return null;
    return this.toLinkTargets(deal, deal.projectId, deal.existingProductId);
  }

  private toLinkTargets(
    deal: WonDealData,
    projectId: string,
    productId?: string | null,
    extensionId?: string | null,
  ): DealWonDriveLinkTargets {
    return {
      dealId: deal.id,
      projectId,
      productId: productId ?? null,
      extensionId: extensionId ?? null,
      companyId: deal.companyId,
      contactId: deal.contactId,
    };
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

    const billingStartDate = firstPaidInvoice.paidDate ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId,
        type: 'DEV_AND_MAINTENANCE',
        baseMonthlyAmount: Number(deal.amount ?? firstPaidInvoice.amount),
        billingDay: billingStartDate.getDate(),
        taxStatus: (deal.taxStatus as Prisma.SubscriptionCreateInput['taxStatus']) ?? 'TAX',
        billingStartDate,
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

  private async runMaintenanceWon(deal: WonDealData): Promise<DealWonDriveLinkTargets | null> {
    if (!deal.projectId || !deal.amount) {
      this.logger.warn(`Maintenance deal ${deal.code} won without project or amount — skipping`);
      return null;
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { projectId: deal.projectId, type: 'MAINTENANCE_ONLY' },
      select: { id: true },
    });
    if (existing) {
      return this.toLinkTargets(deal, deal.projectId, deal.existingProductId);
    }

    const billingStartDate = deal.maintenanceStartAt ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId: deal.projectId,
        type: 'MAINTENANCE_ONLY',
        baseMonthlyAmount: Number(deal.amount),
        billingDay: billingStartDate.getDate(),
        taxStatus: (deal.taxStatus as Prisma.SubscriptionCreateInput['taxStatus']) ?? 'TAX',
        billingStartDate,
        status: 'PENDING',
      },
    });
    return this.toLinkTargets(deal, deal.projectId, deal.existingProductId);
  }

  private async handleExtensionWon(deal: WonDealData): Promise<string | null> {
    if (!deal.existingProductId) {
      this.logger.warn(`Extension deal ${deal.code} won but no existingProductId — skipping`);
      return null;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: deal.existingProductId },
      select: { id: true, projectId: true },
    });
    if (!product) {
      this.logger.warn(`Extension deal ${deal.code}: product ${deal.existingProductId} not found`);
      return null;
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
    return extension.id;
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
    return invoices.find((invoice) => invoice.moneyStatus === 'PAID') ?? null;
  }
}
