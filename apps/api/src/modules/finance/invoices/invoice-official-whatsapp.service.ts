import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InvoiceTypeEnum } from '@nbos/database';
import { isWhatsAppGroupChatId } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { WhatsAppGatewayConnectionService } from '../../integrations/whatsapp-gateway/whatsapp-gateway-connection.service';
import { WhatsAppOutboundQueueService } from '../../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { throwWhatsAppDomainError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { WHATSAPP_ERROR } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { assertOfficialInvoiceRequestSend } from './invoice-tax-readiness-assert';
import {
  canAutoSendOfficialOnAwaiting,
  OFFICIAL_SEND_CANCELLED_MESSAGE,
  officialSendIdempotencyKey,
} from './invoice-official-awaiting-send';
import {
  buildOfficialInvoicePurpose,
  renderOfficialInvoiceCancelMessage,
  renderOfficialInvoiceIssueMessage,
  resolveOfficialCompanyName,
} from './invoice-official-whatsapp-templates';

const OFFICIAL_CONTEXT_SELECT = {
  id: true,
  code: true,
  type: true,
  amount: true,
  taxStatus: true,
  moneyStatus: true,
  officialInvoiceRequestSent: true,
  officialInvoiceCancelledAt: true,
  coverageStartMonth: true,
  companyId: true,
  company: { select: { name: true, legalName: true, taxId: true } },
  project: { select: { name: true } },
  subscription: { select: { product: { select: { name: true } } } },
  clientServiceRecord: { select: { name: true } },
  order: { select: { code: true } },
} as const;

@Injectable()
export class InvoiceOfficialWhatsAppService {
  private readonly logger = new Logger(InvoiceOfficialWhatsAppService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly connection: WhatsAppGatewayConnectionService,
    private readonly outbound: WhatsAppOutboundQueueService,
  ) {}

  async sendAndWait(invoiceId: string): Promise<void> {
    const invoice = await this.loadReadyToSend(invoiceId);
    await this.enqueueOfficial(invoice, 'official_send', true);
  }

  async cancelAndWait(invoiceId: string): Promise<void> {
    const invoice = await this.loadForCancel(invoiceId);
    await this.enqueueOfficial(invoice, 'official_cancel', true);
  }

  async enqueueCancelBestEffort(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.loadForCancel(invoiceId);
      await this.enqueueOfficial(invoice, 'official_cancel', false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Official cancel WhatsApp skipped for ${invoiceId}: ${message}`);
    }
  }

  async enqueueIfAwaitingEligible(invoiceId: string): Promise<void> {
    const invoice = await this.loadContext(invoiceId);
    if (!canAutoSendOfficialOnAwaiting(invoice)) return;
    try {
      await this.enqueueOfficial(
        invoice,
        'official_send',
        false,
        officialSendIdempotencyKey(invoice.id, invoice.officialInvoiceCancelledAt),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Official auto-send skipped for ${invoice.code}: ${message}`);
    }
  }

  private async enqueueOfficial(
    invoice: OfficialWhatsAppInvoice,
    kind: 'official_send' | 'official_cancel',
    wait: boolean,
    idempotencyKey?: string,
  ): Promise<void> {
    const chatId = await this.requireAccountingGroupChatId();
    const fields = this.toFields(invoice);
    const text =
      kind === 'official_send'
        ? renderOfficialInvoiceIssueMessage(fields)
        : renderOfficialInvoiceCancelMessage(fields);
    await this.outbound.enqueue(
      {
        kind,
        chatId,
        text,
        idempotencyKey: idempotencyKey ?? `${kind}:${invoice.id}:${Date.now()}`,
        invoiceId: invoice.id,
      },
      wait,
    );
  }

  private async requireAccountingGroupChatId(): Promise<string> {
    const view = await this.connection.getPublicView();
    const chatId = view.accountingGroupChatId?.trim() ?? '';
    if (!isWhatsAppGroupChatId(chatId)) {
      throwWhatsAppDomainError(
        400,
        WHATSAPP_ERROR.ACCOUNTING_GROUP_NOT_SET,
        'Set the accountant WhatsApp group ID in Settings → Integrations → WhatsApp',
      );
    }
    return chatId;
  }

  private async loadReadyToSend(invoiceId: string): Promise<OfficialWhatsAppInvoice> {
    const invoice = await this.loadContext(invoiceId);
    if (invoice.taxStatus !== 'TAX') {
      throw new BadRequestException('Official invoice request applies only to Tax invoices');
    }
    if (invoice.moneyStatus === 'CANCELLED') {
      throw new BadRequestException(OFFICIAL_SEND_CANCELLED_MESSAGE);
    }
    assertOfficialInvoiceRequestSend(invoice);
    return invoice;
  }

  private async loadForCancel(invoiceId: string): Promise<OfficialWhatsAppInvoice> {
    const invoice = await this.loadContext(invoiceId);
    if (invoice.taxStatus !== 'TAX') {
      throw new BadRequestException('Official invoice request applies only to Tax invoices');
    }
    if (!invoice.officialInvoiceRequestSent) {
      throw new BadRequestException('No active official invoice request to cancel');
    }
    return invoice;
  }

  private async loadContext(invoiceId: string): Promise<OfficialWhatsAppInvoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: OFFICIAL_CONTEXT_SELECT,
    });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    return invoice;
  }

  private toFields(invoice: OfficialWhatsAppInvoice) {
    return {
      code: invoice.code,
      type: invoice.type,
      amount: invoice.amount,
      companyName: resolveOfficialCompanyName(invoice.company),
      companyTaxId: invoice.company?.taxId?.trim() ?? '',
      purpose: buildOfficialInvoicePurpose({
        type: invoice.type,
        code: invoice.code,
        productName: invoice.subscription?.product.name,
        coverageStartMonth: invoice.coverageStartMonth,
        clientServiceName: invoice.clientServiceRecord?.name,
        projectName: invoice.project?.name,
        orderCode: invoice.order?.code,
      }),
    };
  }
}

type OfficialWhatsAppInvoice = {
  id: string;
  code: string;
  type: InvoiceTypeEnum;
  amount: unknown;
  taxStatus: string;
  moneyStatus: string;
  officialInvoiceRequestSent: boolean;
  officialInvoiceCancelledAt: Date | null;
  coverageStartMonth: string | null;
  companyId: string | null;
  company: { name: string; legalName: string | null; taxId: string | null } | null;
  project: { name: string } | null;
  subscription: { product: { name: string } } | null;
  clientServiceRecord: { name: string } | null;
  order: { code: string } | null;
};
