import { BadRequestException, Injectable, Inject, Logger } from '@nestjs/common';
import { mergeEntityContactIds } from '@nbos/shared';
import { syncEntityContactLinks } from '../shared/sync-entity-contact-links.ops';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveDealWonLinksService } from '../../drive/drive-deal-won-links.service';
import type { DealWonDriveLinkTargets } from '../../drive/drive-deal-won-links.types';
import { ProductTeamSyncService } from '../../platform-access/product-team-sync.service';
import { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import { resolveDealOrderTotalAmount } from './deal-order-bootstrap.ops';

interface WonDealData {
  id: string;
  code: string;
  name: string | null;
  type: string | null;
  amount: unknown;
  paymentType: string | null;
  /** Fixed billing periods for SUBSCRIPTION product/extension deals; null = open-ended. */
  subscriptionTermMonths?: number | null;
  taxStatus: string | null;
  contactId: string | null;
  companyId: string | null;
  sellerId: string;
  projectId: string | null;
  productCategory: string | null;
  productType: string | null;
  pmId: string | null;
  deadline: Date | null;
  existingProductId: string | null;
  maintenanceStartAt: Date | null;
  /** OUTSOURCE only; default false. Locked after Won in DealsService.update. */
  outsourceGoesToDelivery?: boolean;
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
    private readonly productTeamSync: ProductTeamSyncService,
    private readonly productWhatsApp: ProductWhatsAppGroupService,
  ) {}

  async handle(deal: WonDealData) {
    await this.syncSubscriptionOrderContractTotalAtWon(deal);
    const targets = await this.resolveWonTargets(deal, 'DEAL_WON');
    if (targets) {
      await this.driveDealWonLinks.linkApprovedDealMaterials(targets);
    }
  }

  /** Creates project/product/extension shell without marking the deal Won (early delivery). */
  async ensureDeliveryShell(deal: WonDealData) {
    await this.resolveWonTargets(deal, 'EARLY_DELIVERY');
  }

  private async syncSubscriptionOrderContractTotalAtWon(deal: WonDealData): Promise<void> {
    if (deal.paymentType !== 'SUBSCRIPTION' || deal.subscriptionTermMonths == null) {
      return;
    }

    const order = await this.prisma.order.findFirst({
      where: { dealId: deal.id },
      select: { id: true, totalAmount: true, subscriptionTermMonths: true },
    });
    if (!order) return;

    const expectedTotalAmount = resolveDealOrderTotalAmount({
      amount: deal.amount,
      paymentType: 'SUBSCRIPTION',
      subscriptionTermMonths: deal.subscriptionTermMonths,
    });
    const currentTotalAmount = Number(order.totalAmount);
    const expectedTermMonths = deal.subscriptionTermMonths;

    if (
      currentTotalAmount === expectedTotalAmount &&
      order.subscriptionTermMonths === expectedTermMonths
    ) {
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: expectedTotalAmount,
        subscriptionTermMonths: expectedTermMonths,
      },
    });
  }

  private async resolveWonTargets(
    deal: WonDealData,
    whatsappSource: 'DEAL_WON' | 'EARLY_DELIVERY',
  ): Promise<DealWonDriveLinkTargets | null> {
    if (deal.type === 'PRODUCT') {
      return this.targetsAfterProductWon(deal, whatsappSource);
    }
    if (deal.type === 'EXTENSION') {
      return this.targetsAfterExtensionWon(deal);
    }
    if (deal.type === 'MAINTENANCE') {
      return this.targetsAfterMaintenanceWon(deal);
    }
    if (deal.type === 'OUTSOURCE') {
      return this.targetsAfterOutsourceWon(deal, whatsappSource);
    }
    return this.targetsFromExistingProject(deal);
  }

  private async targetsAfterOutsourceWon(
    deal: WonDealData,
    whatsappSource: 'DEAL_WON' | 'EARLY_DELIVERY',
  ): Promise<DealWonDriveLinkTargets> {
    const goesToDelivery = deal.outsourceGoesToDelivery === true;
    const result = await this.ensureProductDeliveryShell(deal, whatsappSource, {
      activeDeliveryBoard: goesToDelivery,
    });
    await this.createProductSubscriptionIfReady(deal, result.projectId, result.productId);
    return this.toLinkTargets(deal, result.projectId, result.productId);
  }

  private async targetsAfterProductWon(
    deal: WonDealData,
    whatsappSource: 'DEAL_WON' | 'EARLY_DELIVERY',
  ): Promise<DealWonDriveLinkTargets> {
    const result = await this.ensureProductDeliveryShell(deal, whatsappSource, {
      activeDeliveryBoard: true,
    });
    await this.createProductSubscriptionIfReady(deal, result.projectId, result.productId);
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

  private async ensureProductDeliveryShell(
    deal: WonDealData,
    whatsappSource: 'DEAL_WON' | 'EARLY_DELIVERY',
    options: { activeDeliveryBoard: boolean },
  ): Promise<ProductWonResult> {
    const projectId = await this.ensureProject(deal);
    const productId = await this.ensureProduct(deal, projectId, options);
    await this.syncProjectTeamFromDealShell(deal, projectId, productId);
    if (productId) {
      await this.enqueueProductWhatsApp(productId, deal.id, whatsappSource);
    }
    return { projectId, productId };
  }

  private async enqueueProductWhatsApp(
    productId: string,
    dealId: string,
    source: 'DEAL_WON' | 'EARLY_DELIVERY',
  ): Promise<void> {
    try {
      await this.productWhatsApp.ensureGroupForProduct(productId, {
        source,
        contextDealId: dealId,
      });
    } catch (error) {
      this.logger.warn(
        `WhatsApp ensure after deal ${dealId} product ${productId} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async syncProjectTeamFromDealShell(
    deal: WonDealData,
    projectId: string,
    productId: string | null,
  ): Promise<void> {
    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          pmId: true,
          developerId: true,
          designerId: true,
          technicalSpecialistId: true,
          qaLeadId: true,
        },
      });
      if (product) {
        await this.productTeamSync.syncProductSlots({
          productId,
          projectId,
          row: product,
        });
      }
    }

    await this.productTeamSync.syncProductSeller({
      projectId,
      sellerId: deal.sellerId,
    });
  }

  private async ensureProject(deal: WonDealData): Promise<string> {
    if (deal.projectId) return deal.projectId;
    if (!deal.contactId) {
      throw new BadRequestException(
        `Deal ${deal.code} must have a contact before a project can be created`,
      );
    }

    const projectCode = await this.generateProjectCode();
    const contactId = deal.contactId;
    const project = await this.prisma.project.create({
      data: {
        code: projectCode,
        name: deal.name ?? `Project from ${deal.code}`,
        contactId,
        companyId: deal.companyId ?? undefined,
      },
    });

    await this.prisma.deal.update({
      where: { id: deal.id },
      data: { projectId: project.id },
    });

    const dealAdditional = await this.prisma.dealAdditionalContact.findMany({
      where: { dealId: deal.id },
      select: { contactId: true },
    });
    const additionalIds = dealAdditional.map((row) => row.contactId);
    if (additionalIds.length > 0) {
      await syncEntityContactLinks(
        this.prisma,
        'project',
        project.id,
        mergeEntityContactIds(contactId, additionalIds),
      );
    }

    this.logger.log(`Auto-created project ${projectCode} for deal ${deal.code}`);
    return project.id;
  }

  private async ensureProduct(
    deal: WonDealData,
    projectId: string,
    options: { activeDeliveryBoard: boolean },
  ): Promise<string | null> {
    if (!deal.productCategory || !deal.productType) return null;

    const linkedOrder = await this.prisma.order.findFirst({
      where: { dealId: deal.id, productId: { not: null } },
      select: { productId: true },
    });
    if (linkedOrder?.productId) return linkedOrder.productId;

    const product = await this.prisma.product.create({
      data: {
        projectId,
        name: deal.name ?? `Product from ${deal.code}`,
        productCategory: deal.productCategory as Prisma.ProductCreateInput['productCategory'],
        productType: deal.productType as Prisma.ProductCreateInput['productType'],
        pmId: deal.pmId ?? undefined,
        deadline: deal.deadline ?? undefined,
        ...(options.activeDeliveryBoard
          ? {}
          : {
              status: 'DONE' as const,
              deliveryStage: null,
              deliveryResolution: 'DONE' as const,
            }),
      },
    });

    await this.prisma.order.updateMany({
      where: { dealId: deal.id, productId: null },
      data: { productId: product.id },
    });

    this.logger.log(
      `Auto-created product ${product.id} (${deal.productCategory}/${deal.productType}) for deal ${deal.code}`,
    );
    return product.id;
  }

  private async createProductSubscriptionIfReady(
    deal: WonDealData,
    projectId: string,
    productId: string | null,
  ) {
    if (deal.paymentType !== 'SUBSCRIPTION') return;
    if (!productId) {
      this.logger.warn(
        `Deal ${deal.code}: subscription skipped — productId missing after product shell`,
      );
      return;
    }

    const firstPaidInvoice = this.getFirstPaidInvoice(deal);
    if (!firstPaidInvoice) return;

    const termMonths = deal.subscriptionTermMonths ?? null;
    const subscriptionType = termMonths != null ? 'DEV_ONLY' : 'DEV_AND_MAINTENANCE';

    const existing = await this.prisma.subscription.findFirst({
      where: { productId, type: subscriptionType },
      select: { id: true },
    });
    if (existing) return;

    const billingStartDate = firstPaidInvoice.paidDate ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId,
        productId,
        type: subscriptionType,
        amount: Number(deal.amount ?? firstPaidInvoice.amount),
        coverageMonthCount: 1,
        ...(termMonths != null ? { termMonths } : {}),
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
    if (!deal.existingProductId) {
      this.logger.warn(
        `Maintenance deal ${deal.code} won without existingProductId — subscription not created`,
      );
      return this.toLinkTargets(deal, deal.projectId, null);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: deal.existingProductId },
      select: { id: true, projectId: true },
    });
    if (!product || product.projectId !== deal.projectId) {
      this.logger.warn(
        `Maintenance deal ${deal.code}: existingProductId invalid for project — subscription not created`,
      );
      return this.toLinkTargets(deal, deal.projectId, deal.existingProductId);
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { productId: product.id, type: 'MAINTENANCE_ONLY' },
      select: { id: true },
    });
    if (existing) {
      return this.toLinkTargets(deal, deal.projectId, product.id);
    }

    const billingStartDate = deal.maintenanceStartAt ?? new Date();
    await this.prisma.subscription.create({
      data: {
        code: await this.generateSubscriptionCode(),
        projectId: deal.projectId,
        productId: product.id,
        type: 'MAINTENANCE_ONLY',
        amount: Number(deal.amount),
        coverageMonthCount: 1,
        billingDay: billingStartDate.getDate(),
        taxStatus: (deal.taxStatus as Prisma.SubscriptionCreateInput['taxStatus']) ?? 'TAX',
        billingStartDate,
        status: 'PENDING',
      },
    });
    return this.toLinkTargets(deal, deal.projectId, product.id);
  }

  private async handleExtensionWon(deal: WonDealData): Promise<string | null> {
    if (!deal.existingProductId) {
      this.logger.warn(`Extension deal ${deal.code} won but no existingProductId — skipping`);
      return null;
    }

    const linkedOrder = await this.prisma.order.findFirst({
      where: { dealId: deal.id, extensionId: { not: null } },
      select: { extensionId: true },
    });
    if (linkedOrder?.extensionId) return linkedOrder.extensionId;

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

    await this.prisma.order.updateMany({
      where: { dealId: deal.id, extensionId: null },
      data: { extensionId: extension.id },
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
