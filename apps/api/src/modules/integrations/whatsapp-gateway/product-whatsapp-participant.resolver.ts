import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { normalizePhoneToWhatsAppJid } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import type {
  ProductWhatsAppParticipantCandidate,
  ProductWhatsAppParticipantWarning,
} from './whatsapp-gateway.types';

export interface ResolvedProductWhatsAppParticipants {
  dealId: string | null;
  candidates: ProductWhatsAppParticipantCandidate[];
  warnings: ProductWhatsAppParticipantWarning[];
  ceoEmployeeId: string | null;
  multipleCeoWarning: boolean;
}

@Injectable()
export class ProductWhatsAppParticipantResolver {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async resolve(
    productId: string,
    contextDealId?: string | null,
  ): Promise<ResolvedProductWhatsAppParticipants> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        pmId: true,
        technicalSpecialistId: true,
        order: { select: { dealId: true, deal: { select: dealSelect } } },
        teamMembers: {
          where: { slot: 'PM' },
          select: { employeeId: true },
          take: 1,
        },
      },
    });
    if (!product) {
      return {
        dealId: null,
        candidates: [],
        warnings: [{ role: 'PRODUCT', code: 'PRODUCT_NOT_FOUND', message: 'Product not found' }],
        ceoEmployeeId: null,
        multipleCeoWarning: false,
      };
    }

    let deal =
      contextDealId != null
        ? await this.prisma.deal.findUnique({
            where: { id: contextDealId },
            select: dealSelect,
          })
        : null;
    if (!deal && product.order?.deal) {
      deal = product.order.deal;
    }

    const byEmployee = new Map<string, { roles: Set<string>; phone: string | null }>();
    const warnings: ProductWhatsAppParticipantWarning[] = [];

    const pushEmployee = (
      role: string,
      employee: { id: string; phone: string | null } | null | undefined,
    ) => {
      if (!employee) {
        warnings.push({
          role,
          code: 'EMPLOYEE_MISSING',
          message: `${role} is not assigned`,
        });
        return;
      }
      const existing = byEmployee.get(employee.id) ?? {
        roles: new Set<string>(),
        phone: employee.phone,
      };
      existing.roles.add(role);
      existing.phone = employee.phone;
      byEmployee.set(employee.id, existing);
    };

    pushEmployee('SALES_MANAGER', deal?.seller ?? null);
    pushEmployee('SALES_ASSISTANT', deal?.sellerAssistant ?? null);

    if (product.pmId) {
      const pm = await this.prisma.employee.findUnique({
        where: { id: product.pmId },
        select: { id: true, phone: true },
      });
      pushEmployee('PROJECT_MANAGER', pm);
    } else if (deal?.pm) {
      pushEmployee('PROJECT_MANAGER', deal.pm);
    } else if (product.teamMembers[0]) {
      const pm = await this.prisma.employee.findUnique({
        where: { id: product.teamMembers[0].employeeId },
        select: { id: true, phone: true },
      });
      pushEmployee('PROJECT_MANAGER', pm);
    } else {
      warnings.push({
        role: 'PROJECT_MANAGER',
        code: 'EMPLOYEE_MISSING',
        message: 'Project Manager is not assigned',
      });
    }

    const ceos = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE', role: { slug: 'ceo' } },
      select: { id: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });
    let ceoEmployeeId: string | null = null;
    let multipleCeoWarning = false;
    if (ceos.length === 0) {
      warnings.push({
        role: 'CEO',
        code: 'EMPLOYEE_MISSING',
        message: 'No active CEO found',
      });
    } else {
      if (ceos.length > 1) {
        multipleCeoWarning = true;
        warnings.push({
          role: 'CEO',
          employeeId: ceos[0].id,
          code: 'MULTIPLE_CEO',
          message: `Multiple active CEOs found; using ${ceos[0].id}`,
        });
      }
      ceoEmployeeId = ceos[0].id;
      pushEmployee('CEO', ceos[0]);
    }

    const candidates: ProductWhatsAppParticipantCandidate[] = [];
    for (const [employeeId, entry] of byEmployee) {
      const normalized = normalizePhoneToWhatsAppJid(entry.phone);
      if (!normalized.success) {
        warnings.push({
          employeeId,
          role: [...entry.roles].join(','),
          code: normalized.reason,
          message: `Phone ${normalized.reason.toLowerCase()} for employee ${employeeId}`,
        });
        continue;
      }
      candidates.push({
        employeeId,
        jid: normalized.jid,
        roles: [...entry.roles],
      });
    }

    return {
      dealId: deal?.id ?? product.order?.dealId ?? null,
      candidates,
      warnings,
      ceoEmployeeId,
      multipleCeoWarning,
    };
  }

  async resolveForDeal(dealId: string): Promise<ResolvedProductWhatsAppParticipants> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: dealSelect,
    });
    if (!deal) {
      return {
        dealId: null,
        candidates: [],
        warnings: [{ role: 'DEAL', code: 'DEAL_NOT_FOUND', message: 'Deal not found' }],
        ceoEmployeeId: null,
        multipleCeoWarning: false,
      };
    }
    const byEmployee = new Map<string, { roles: Set<string>; phone: string | null }>();
    const warnings: ProductWhatsAppParticipantWarning[] = [];
    const push = (role: string, employee: { id: string; phone: string | null } | null) => {
      if (!employee) {
        warnings.push({ role, code: 'EMPLOYEE_MISSING', message: `${role} is not assigned` });
        return;
      }
      const existing = byEmployee.get(employee.id) ?? {
        roles: new Set<string>(),
        phone: employee.phone,
      };
      existing.roles.add(role);
      existing.phone = employee.phone;
      byEmployee.set(employee.id, existing);
    };
    push('SALES_MANAGER', deal.seller);
    push('SALES_ASSISTANT', deal.sellerAssistant);
    push('PROJECT_MANAGER', deal.pm);
    const ceo = await this.pushActiveCeo(push, warnings);
    return {
      dealId: deal.id,
      candidates: this.toCandidates(byEmployee, warnings),
      warnings,
      ceoEmployeeId: ceo,
      multipleCeoWarning: warnings.some((row) => row.code === 'MULTIPLE_CEO'),
    };
  }

  async resolveTechnicalSpecialist(
    productId: string,
  ): Promise<ProductWhatsAppParticipantCandidate | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        technicalSpecialistId: true,
        technicalSpecialist: { select: { id: true, phone: true } },
      },
    });
    if (!product?.technicalSpecialist) return null;
    const normalized = normalizePhoneToWhatsAppJid(product.technicalSpecialist.phone);
    if (!normalized.success) return null;
    return {
      employeeId: product.technicalSpecialist.id,
      jid: normalized.jid,
      roles: ['TECHNICAL_SPECIALIST'],
    };
  }

  private async pushActiveCeo(
    push: (role: string, employee: { id: string; phone: string | null } | null) => void,
    warnings: ProductWhatsAppParticipantWarning[],
  ): Promise<string | null> {
    const ceos = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE', role: { slug: 'ceo' } },
      select: { id: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });
    if (ceos.length === 0) {
      warnings.push({ role: 'CEO', code: 'EMPLOYEE_MISSING', message: 'No active CEO found' });
      return null;
    }
    if (ceos.length > 1) {
      warnings.push({
        role: 'CEO',
        employeeId: ceos[0].id,
        code: 'MULTIPLE_CEO',
        message: `Multiple active CEOs found; using ${ceos[0].id}`,
      });
    }
    push('CEO', ceos[0]);
    return ceos[0].id;
  }

  private toCandidates(
    byEmployee: Map<string, { roles: Set<string>; phone: string | null }>,
    warnings: ProductWhatsAppParticipantWarning[],
  ): ProductWhatsAppParticipantCandidate[] {
    const candidates: ProductWhatsAppParticipantCandidate[] = [];
    for (const [employeeId, entry] of byEmployee) {
      const normalized = normalizePhoneToWhatsAppJid(entry.phone);
      if (!normalized.success) {
        warnings.push({
          employeeId,
          role: [...entry.roles].join(','),
          code: normalized.reason,
          message: `Phone ${normalized.reason.toLowerCase()} for employee ${employeeId}`,
        });
        continue;
      }
      candidates.push({ employeeId, jid: normalized.jid, roles: [...entry.roles] });
    }
    return candidates;
  }
}

const dealSelect = {
  id: true,
  sellerId: true,
  sellerAssistantId: true,
  pmId: true,
  contactId: true,
  seller: { select: { id: true, phone: true } },
  sellerAssistant: { select: { id: true, phone: true } },
  pm: { select: { id: true, phone: true } },
} as const;
