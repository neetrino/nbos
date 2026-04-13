import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient, DealTypeEnum, PaymentTypeEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { LeadsService } from './leads.service';

interface ConvertLeadDto {
  dealType: string;
  amount?: number;
  paymentType?: string;
  sellerId: string;
}

@Injectable()
export class LeadConversionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly leadsService: LeadsService,
  ) {}

  async convertToDeal(leadId: string, data: ConvertLeadDto) {
    const lead = await this.leadsService.findById(leadId);

    if (lead.status !== 'SQL') {
      throw new BadRequestException(
        `Lead must be in SQL status to convert. Current: ${lead.status}`,
      );
    }

    if (lead.deal) {
      throw new BadRequestException('Lead already has an associated deal');
    }

    const year = new Date().getFullYear();
    const lastDeal = await this.prisma.deal.findFirst({
      where: { code: { startsWith: `D-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = lastDeal ? parseInt(lastDeal.code.split('-')[2] ?? '0', 10) + 1 : 1;
    const dealCode = `D-${year}-${String(nextNum).padStart(4, '0')}`;

    let contactId = lead.contactId;
    if (!contactId) {
      const nameParts = lead.contactName.split(' ');
      const contact = await this.prisma.contact.create({
        data: {
          firstName: nameParts[0] ?? lead.contactName,
          lastName: nameParts.slice(1).join(' ') || '-',
          phone: lead.phone,
          email: lead.email,
        },
      });
      contactId = contact.id;
    }

    const deal = await this.prisma.deal.create({
      data: {
        code: dealCode,
        leadId: lead.id,
        contactId,
        type: data.dealType as DealTypeEnum,
        amount: data.amount,
        paymentType: data.paymentType ? (data.paymentType as PaymentTypeEnum) : undefined,
        sellerId: data.sellerId,
        source: lead.source,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { contactId },
    });

    return deal;
  }
}
