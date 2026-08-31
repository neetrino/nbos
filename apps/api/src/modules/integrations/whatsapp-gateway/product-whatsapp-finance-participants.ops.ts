import type { PrismaClient } from '@nbos/database';
import {
  CEO_ROLE_SLUG,
  PLATFORM_OWNERSHIP_SINGLETON_ID,
  normalizePhoneToWhatsAppJid,
} from '@nbos/shared';
import { FINANCE_DIRECTOR_ROLE_SLUG } from '../../messenger/core/messenger-core-attention.constants';
import type {
  ProductWhatsAppParticipantCandidate,
  ProductWhatsAppParticipantWarning,
} from './whatsapp-gateway.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type FinanceTemplateParticipants = {
  candidates: ProductWhatsAppParticipantCandidate[];
  warnings: ProductWhatsAppParticipantWarning[];
};

const dealSelect = {
  id: true,
  seller: { select: { id: true, phone: true } },
  pm: { select: { id: true, phone: true } },
} as const;

/**
 * Dedicated FINANCE WhatsApp group template (M-WA-05). Developers are not added.
 * Binding still does not grant Client SEND.
 */
export async function resolveFinanceTemplateParticipants(
  prisma: PrismaLike,
  productId: string,
  contextDealId?: string | null,
): Promise<FinanceTemplateParticipants> {
  const byEmployee = new Map<string, { roles: Set<string>; phone: string | null }>();
  const warnings: ProductWhatsAppParticipantWarning[] = [];
  const push = (
    role: string,
    employee: { id: string; phone: string | null } | null | undefined,
  ) => {
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

  const product = await loadFinanceProduct(prisma, productId);
  if (!product) {
    return {
      candidates: [],
      warnings: [{ role: 'PRODUCT', code: 'PRODUCT_NOT_FOUND', message: 'Product not found' }],
    };
  }
  await pushOwnerCeoFinance(prisma, push, warnings);
  const deal = await loadFinanceDeal(prisma, product, contextDealId);
  push('SALES_MANAGER', deal?.seller ?? null);
  pushProductPm(product, deal, push);
  return { candidates: toCandidates(byEmployee, warnings), warnings };
}

async function loadFinanceProduct(prisma: PrismaLike, productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      pmId: true,
      order: { select: { dealId: true, deal: { select: dealSelect } } },
      teamMembers: { where: { slot: 'PM' }, select: { employeeId: true }, take: 1 },
      pm: { select: { id: true, phone: true } },
    },
  });
}

async function loadFinanceDeal(
  prisma: PrismaLike,
  product: NonNullable<Awaited<ReturnType<typeof loadFinanceProduct>>>,
  contextDealId?: string | null,
) {
  if (contextDealId) {
    return prisma.deal.findUnique({ where: { id: contextDealId }, select: dealSelect });
  }
  return product.order?.deal ?? null;
}

async function pushOwnerCeoFinance(
  prisma: PrismaLike,
  push: (role: string, employee: { id: string; phone: string | null } | null | undefined) => void,
  warnings: ProductWhatsAppParticipantWarning[],
): Promise<void> {
  const ownership = await prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true, owner: { select: { id: true, phone: true } } },
  });
  push('OWNER', ownership?.owner ?? null);
  const ceos = await prisma.employee.findMany({
    where: { status: 'ACTIVE', role: { slug: CEO_ROLE_SLUG } },
    select: { id: true, phone: true },
    orderBy: { createdAt: 'asc' },
    take: 1,
  });
  push('CEO', ceos[0] ?? null);
  const directors = await prisma.employee.findMany({
    where: { status: 'ACTIVE', role: { slug: FINANCE_DIRECTOR_ROLE_SLUG } },
    select: { id: true, phone: true },
    orderBy: { createdAt: 'asc' },
  });
  if (directors.length === 0) {
    warnings.push({
      role: 'FINANCE_DIRECTOR',
      code: 'EMPLOYEE_MISSING',
      message: 'Finance Director is not assigned',
    });
  }
  for (const director of directors) push('FINANCE_DIRECTOR', director);
}

function pushProductPm(
  product: NonNullable<Awaited<ReturnType<typeof loadFinanceProduct>>>,
  deal: { pm: { id: string; phone: string | null } | null } | null,
  push: (role: string, employee: { id: string; phone: string | null } | null | undefined) => void,
): void {
  if (product.pm) {
    push('PROJECT_MANAGER', product.pm);
    return;
  }
  if (deal?.pm) {
    push('PROJECT_MANAGER', deal.pm);
    return;
  }
  push('PROJECT_MANAGER', null);
}

function toCandidates(
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
