import type { PrismaClient } from '../src/generated/prisma/client';
import type {
  InvoiceMoneyStatusEnum,
  OrderStatusEnum,
  ProductBonusPoolStatusEnum,
  ProductStatusEnum,
} from '../src/generated/prisma/enums';

const BONUS_RELEASE_COUNTING_STATUSES = [
  'DRAFT',
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
] as const;

function deriveProductBonusPoolStatus(
  planned: number,
  released: number,
  remaining: number,
): ProductBonusPoolStatusEnum {
  if (planned <= 0) {
    return 'ACTIVE';
  }
  if (remaining <= 0) {
    return 'CLOSED';
  }
  if (released > 0) {
    return 'PARTIALLY_RELEASED';
  }
  return 'ACTIVE';
}

/** Recompute pools from payments + releases so matrix Avail matches ledger. */
async function syncAllProductBonusPools(prisma: PrismaClient): Promise<void> {
  const orders = await prisma.order.findMany({
    where: { type: { in: ['PRODUCT', 'EXTENSION'] } },
    select: {
      id: true,
      projectId: true,
      productId: true,
      extensionId: true,
    },
  });

  for (const order of orders) {
    const [plannedAgg, paidEntryAgg, releasedAgg, paymentsAgg] = await Promise.all([
      prisma.bonusEntry.aggregate({ where: { orderId: order.id }, _sum: { amount: true } }),
      prisma.bonusEntry.aggregate({
        where: { orderId: order.id, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.bonusRelease.aggregate({
        where: {
          status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
          bonusEntry: { orderId: order.id },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { invoice: { orderId: order.id } },
        _sum: { amount: true },
      }),
    ]);

    const planned = Number(plannedAgg._sum.amount ?? 0);
    const released = Number(releasedAgg._sum.amount ?? 0);
    const received = Number(paymentsAgg._sum.amount ?? 0);
    const remaining = Math.max(0, planned - released);
    const availableFunding = Math.max(0, received - released);
    const overFundingAmount = Math.max(0, released - received);
    const status = deriveProductBonusPoolStatus(planned, released, remaining);

    await prisma.productBonusPool.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        projectId: order.projectId,
        productId: order.productId,
        extensionId: order.extensionId,
        totalPlannedAmount: planned,
        totalReleasedAmount: released,
        totalPaidAmount: Number(paidEntryAgg._sum.amount ?? 0),
        totalRemainingAmount: remaining,
        availableFunding,
        overFundingAmount,
        status,
      },
      update: {
        projectId: order.projectId,
        productId: order.productId,
        extensionId: order.extensionId,
        totalPlannedAmount: planned,
        totalReleasedAmount: released,
        totalPaidAmount: Number(paidEntryAgg._sum.amount ?? 0),
        totalRemainingAmount: remaining,
        availableFunding,
        overFundingAmount,
        status,
      },
    });
  }
}

const RICH_PROJECT_START = 6;
const RICH_PROJECT_END = 20;
const ARCHIVED_PROJECT_SUFFIXES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

/** Realistic client engagements for rich demo matrix columns. */
const RICH_DEMO_ENGAGEMENTS = [
  {
    project: 'Nike Digital',
    product: 'nike.com',
    category: 'CODE' as const,
    type: 'COMPANY_WEBSITE' as const,
  },
  {
    project: 'Apple Enterprise',
    product: 'apple.com',
    category: 'CODE' as const,
    type: 'COMPANY_WEBSITE' as const,
  },
  {
    project: 'Spotify',
    product: 'Spotify iOS App',
    category: 'CODE' as const,
    type: 'MOBILE_APP' as const,
  },
  { project: 'Airbnb', product: 'airbnb.com', category: 'CODE' as const, type: 'WEB_APP' as const },
  {
    project: 'Stripe',
    product: 'stripe.com',
    category: 'CODE' as const,
    type: 'COMPANY_WEBSITE' as const,
  },
  {
    project: 'Shopify',
    product: 'Shopify Admin',
    category: 'CODE' as const,
    type: 'WEB_APP' as const,
  },
  {
    project: 'Netflix',
    product: 'Netflix tvOS App',
    category: 'CODE' as const,
    type: 'MOBILE_APP' as const,
  },
  { project: 'Uber', product: 'uber.com', category: 'CODE' as const, type: 'WEB_APP' as const },
  {
    project: 'Tesla',
    product: 'tesla.com',
    category: 'CODE' as const,
    type: 'COMPANY_WEBSITE' as const,
  },
  {
    project: 'Meta',
    product: 'Meta Ads Portal',
    category: 'CODE' as const,
    type: 'WEB_APP' as const,
  },
  {
    project: 'Amazon',
    product: 'amazon.sc',
    category: 'SHOPIFY' as const,
    type: 'ECOMMERCE' as const,
  },
  {
    project: 'Adobe',
    product: 'adobe.com',
    category: 'CODE' as const,
    type: 'COMPANY_WEBSITE' as const,
  },
  {
    project: 'Slack',
    product: 'Slack Desktop',
    category: 'CODE' as const,
    type: 'WEB_APP' as const,
  },
  { project: 'Figma', product: 'figma.com', category: 'CODE' as const, type: 'WEB_APP' as const },
  {
    project: 'Notion',
    product: 'Notion Mobile',
    category: 'CODE' as const,
    type: 'MOBILE_APP' as const,
  },
];

const PRODUCT_STATUSES_ACTIVE: ProductStatusEnum[] = [
  'NEW',
  'CREATING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
];
const PRODUCT_STATUSES_CLOSED: ProductStatusEnum[] = ['DONE', 'DONE', 'TRANSFER'];

type SeedEmp = { id: string; email: string };

export type SeedRichDemoContext = {
  ceo: SeedEmp;
  seller: SeedEmp;
  seller2: SeedEmp;
  pm: SeedEmp;
  pm2: SeedEmp;
  dev: SeedEmp;
  designer: SeedEmp;
  partner1: { id: string };
  contactIds: string[];
  companyIds: (string | null)[];
  existing: {
    projectIds: string[];
    orderIds: string[];
    productIds: string[];
    subscriptionCodes: string[];
  };
};

type CreatedProject = {
  id: string;
  code: string;
  companyId: string | null;
  contactId: string;
  archived: boolean;
};

function padCode(n: number): string {
  return String(n).padStart(4, '0');
}

function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function coverageMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Spread realistic invoice money statuses across a project lifecycle index. */
function invoiceStatusForSlice(slice: number, paid: boolean): InvoiceMoneyStatusEnum {
  if (paid) return 'PAID';
  if (slice % 5 === 0) return 'OVERDUE';
  if (slice % 4 === 0) return 'ON_HOLD';
  if (slice % 3 === 0) return 'AWAITING_PAYMENT';
  if (slice % 2 === 0) return 'NEW';
  return 'AWAITING_PAYMENT';
}

async function archiveHalfOfProjects(prisma: PrismaClient): Promise<void> {
  for (const suffix of ARCHIVED_PROJECT_SUFFIXES) {
    const code = `P-2026-${padCode(suffix)}`;
    await prisma.project.updateMany({
      where: { code },
      data: { trashedAt: new Date() },
    });
  }
}

async function seedCompensationProfiles(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
): Promise<Record<string, string>> {
  const profiles: Array<{
    employeeId: string;
    baseSalary: number;
    notes: string;
    kpiPolicyId: string | null;
  }> = [
    {
      employeeId: ctx.ceo.id,
      baseSalary: 850_000,
      notes: 'CEO fixed monthly',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
    {
      employeeId: ctx.seller.id,
      baseSalary: 480_000,
      notes: 'Senior seller — KPI policy active',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
    {
      employeeId: ctx.seller2.id,
      baseSalary: 420_000,
      notes: 'Seller — no KPI policy (full bonus payable)',
      kpiPolicyId: null,
    },
    {
      employeeId: ctx.pm.id,
      baseSalary: 620_000,
      notes: 'Senior PM base',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
    {
      employeeId: ctx.pm2.id,
      baseSalary: 520_000,
      notes: 'Middle PM base',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
    {
      employeeId: ctx.dev.id,
      baseSalary: 580_000,
      notes: 'Middle developer base',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
    {
      employeeId: ctx.designer.id,
      baseSalary: 450_000,
      notes: 'Designer base',
      kpiPolicyId: 'a0000000-0000-4000-8000-000000000001',
    },
  ];

  const byEmployee: Record<string, string> = {};
  for (const row of profiles) {
    const profile = await prisma.compensationProfile.create({
      data: {
        employeeId: row.employeeId,
        baseSalary: row.baseSalary,
        currency: 'AMD',
        kpiPolicyId: row.kpiPolicyId,
        effectiveFrom: monthStart(2026, 1),
        status: 'ACTIVE',
        approvedById: ctx.ceo.id,
        approvedAt: monthStart(2026, 1),
        source: 'seed-rich-demo',
        notes: row.notes,
      },
    });
    byEmployee[row.employeeId] = profile.id;
  }
  return byEmployee;
}

async function seedPayrollAndSalaries(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
  compensationByEmployee: Record<string, string>,
): Promise<void> {
  const employees = [ctx.ceo, ctx.seller, ctx.seller2, ctx.pm, ctx.pm2, ctx.dev, ctx.designer];
  const months: Array<{
    key: string;
    status: 'CLOSED' | 'APPROVED' | 'DRAFT';
    paySalaries: boolean;
  }> = [
    { key: '2026-01', status: 'CLOSED', paySalaries: true },
    { key: '2026-02', status: 'CLOSED', paySalaries: true },
    { key: '2026-03', status: 'CLOSED', paySalaries: true },
    { key: '2026-04', status: 'APPROVED', paySalaries: false },
    { key: '2026-05', status: 'DRAFT', paySalaries: false },
  ];

  for (const month of months) {
    let totalBase = 0;
    let totalBonuses = 0;
    let totalPayable = 0;
    let totalPaid = 0;

    const run = await prisma.payrollRun.create({
      data: {
        payrollMonth: month.key,
        status: month.status,
        createdById: ctx.ceo.id,
        approvedById: month.status !== 'DRAFT' ? ctx.ceo.id : null,
        approvedAt: month.status !== 'DRAFT' ? monthStart(2026, Number(month.key.slice(5))) : null,
        closedAt:
          month.status === 'CLOSED' ? monthStart(2026, Number(month.key.slice(5)) + 1) : null,
        kpiSalesPlanAmount: 5_000_000,
        kpiSalesActualAmount: month.key === '2026-03' ? 5_200_000 : 4_100_000,
      },
    });

    for (const emp of employees) {
      const profileId = compensationByEmployee[emp.id];
      const profile = profileId
        ? await prisma.compensationProfile.findUniqueOrThrow({ where: { id: profileId } })
        : null;
      const base = profile ? Number(profile.baseSalary) : 400_000;
      const bonuses = emp.id === ctx.seller.id && month.key === '2026-03' ? 125_000 : 0;
      const payable = base + bonuses;
      const paid = month.paySalaries ? payable : 0;
      const lineStatus = month.paySalaries
        ? 'PAID'
        : month.status === 'APPROVED'
          ? 'APPROVED'
          : 'PENDING';

      totalBase += base;
      totalBonuses += bonuses;
      totalPayable += payable;
      totalPaid += paid;

      const expense =
        month.paySalaries && emp.id === ctx.ceo.id
          ? await prisma.expense.create({
              data: {
                type: 'PLANNED',
                category: 'SALARY',
                name: `Salary — ${month.key} — ${emp.email}`,
                amount: payable,
                frequency: 'ONE_TIME',
                status: 'PAID',
                taxStatus: 'TAX',
              },
            })
          : null;

      await prisma.salaryLine.create({
        data: {
          payrollRunId: run.id,
          employeeId: emp.id,
          compensationProfileId: profileId ?? null,
          baseSalary: base,
          bonusesTotal: bonuses,
          totalPayable: payable,
          paidAmount: paid,
          remainingAmount: payable - paid,
          status: lineStatus,
          expenseId: expense?.id ?? null,
        },
      });

      if (month.paySalaries && expense) {
        await prisma.expensePayment.create({
          data: {
            expenseId: expense.id,
            amount: payable,
            paymentDate: monthStart(2026, Number(month.key.slice(5)) + 1),
            notes: 'Seeded payroll payout',
          },
        });
      }
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        totalBaseSalary: totalBase,
        totalBonuses,
        totalPayable,
        totalPaid,
      },
    });
  }
}

async function seedBonusPoolsAndReleases(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
): Promise<void> {
  const marRun = await prisma.payrollRun.findUniqueOrThrow({
    where: { payrollMonth: '2026-03' },
  });

  const pools: Array<{
    orderId: string;
    projectId: string;
    productId: string | null;
    planned: number;
    released: number;
    paid: number;
  }> = [
    {
      orderId: ctx.existing.orderIds[0]!,
      projectId: ctx.existing.projectIds[0]!,
      productId: ctx.existing.productIds[0] ?? null,
      planned: 125_000,
      released: 75_000,
      paid: 75_000,
    },
    {
      orderId: ctx.existing.orderIds[1]!,
      projectId: ctx.existing.projectIds[0]!,
      productId: ctx.existing.productIds[1] ?? null,
      planned: 60_000,
      released: 60_000,
      paid: 60_000,
    },
  ];

  for (const pool of pools) {
    await prisma.productBonusPool.create({
      data: {
        orderId: pool.orderId,
        projectId: pool.projectId,
        productId: pool.productId,
        totalPlannedAmount: pool.planned,
        totalReleasedAmount: pool.released,
        totalPaidAmount: pool.paid,
        totalRemainingAmount: pool.planned - pool.released,
        availableFunding: pool.planned,
        status: pool.released >= pool.planned ? 'CLOSED' : 'PARTIALLY_RELEASED',
      },
    });
  }

  const entries = await prisma.bonusEntry.findMany({ take: 10 });
  for (const entry of entries) {
    const releaseAmount = Number(entry.amount) * 0.5;
    await prisma.bonusRelease.create({
      data: {
        bonusEntryId: entry.id,
        payrollRunId: entry.status === 'EARNED' ? marRun.id : null,
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        amount: releaseAmount,
        payrollIncludedAmount: entry.status === 'EARNED' ? releaseAmount : null,
        releaseType: entry.status === 'EARNED' ? 'AUTO' : 'MANUAL',
        status: entry.status === 'EARNED' ? 'INCLUDED_IN_PAYROLL' : 'APPROVED',
        approvedById: ctx.ceo.id,
      },
    });
  }
}

async function seedClientServicesForProjects(
  prisma: PrismaClient,
  projectIds: string[],
): Promise<void> {
  const types = ['DOMAIN', 'HOSTING', 'SERVICE', 'LICENSE'] as const;
  let idx = 0;
  for (const projectId of projectIds) {
    for (let t = 0; t < 2; t += 1) {
      const type = types[(idx + t) % types.length]!;
      await prisma.clientServiceRecord.create({
        data: {
          projectId,
          type,
          name: `Seeded ${type} — project slice ${idx}`,
          provider: type === 'DOMAIN' ? 'Namecheap' : 'AWS',
          status: idx % 3 === 0 ? 'EXPIRING_SOON' : 'ACTIVE',
          billingModel: t === 0 ? 'WE_PAY' : 'REMINDER_ONLY',
          ourCost: 8_000 + idx * 500,
          clientCharge: 12_000 + idx * 800,
          renewalDate: new Date('2026-08-15'),
          startDate: new Date('2025-06-01'),
        },
      });
    }
    idx += 1;
  }
}

async function seedSubscriptionHistory(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
): Promise<void> {
  const subs = await prisma.subscription.findMany({
    where: { code: { in: ctx.existing.subscriptionCodes } },
  });

  let invSeq = 20;
  for (const sub of subs) {
    const companyId = ctx.companyIds[0];
    for (let m = 1; m <= 4; m += 1) {
      const mk = coverageMonth(2026, m);
      const paid = m <= 2;
      invSeq += 1;
      const inv = await prisma.invoice.create({
        data: {
          code: `INV-2026-${String(invSeq).padStart(4, '0')}`,
          subscriptionId: sub.id,
          projectId: sub.projectId,
          companyId: companyId ?? undefined,
          amount: sub.baseMonthlyAmount,
          type: 'SUBSCRIPTION',
          moneyStatus: paid ? 'PAID' : m === 3 ? 'OVERDUE' : 'AWAITING_PAYMENT',
          coverageStartMonth: mk,
          coverageMonthCount: 1,
          dueDate: monthStart(2026, m + 1),
          paidDate: paid ? monthStart(2026, m + 1) : null,
          taxStatus: sub.taxStatus,
        },
      });
      if (paid) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            amount: sub.baseMonthlyAmount,
            paymentDate: monthStart(2026, m + 1),
            paymentMethod: 'BANK_TRANSFER',
            confirmedBy: ctx.ceo.id,
          },
        });
      }
    }
  }
}

async function createRichProjectBundle(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
  index: number,
  contactId: string,
  companyId: string | null,
): Promise<CreatedProject> {
  const suffix = index;
  const code = `P-2026-${padCode(suffix)}`;
  const archived = ARCHIVED_PROJECT_SUFFIXES.includes(suffix);
  const engagement =
    RICH_DEMO_ENGAGEMENTS[(suffix - RICH_PROJECT_START) % RICH_DEMO_ENGAGEMENTS.length]!;
  const assignedSeller = suffix % 2 === 0 ? ctx.seller.id : ctx.seller2.id;
  const project = await prisma.project.create({
    data: {
      code,
      name: engagement.project,
      contactId,
      companyId: companyId ?? undefined,
      description: archived
        ? 'Archived project with completed delivery and maintenance.'
        : 'Active delivery and recurring maintenance.',
      trashedAt: archived ? new Date() : null,
    },
  });

  const productStatuses = archived ? PRODUCT_STATUSES_CLOSED : PRODUCT_STATUSES_ACTIVE;
  const dealAmount = 1_200_000 + suffix * 150_000;
  const product = await prisma.product.create({
    data: {
      projectId: project.id,
      name: engagement.product,
      productCategory: engagement.category,
      productType: engagement.type,
      status: productStatuses[suffix % productStatuses.length]!,
      pmId: suffix % 2 === 0 ? ctx.pm.id : ctx.pm2.id,
      deadline: new Date('2026-09-30'),
      closedAt: archived ? new Date('2025-12-01') : null,
      closedById: archived ? ctx.pm.id : null,
    },
  });

  const deal = await prisma.deal.create({
    data: {
      code: `D-2026-${padCode(10 + suffix)}`,
      contactId,
      companyId: companyId ?? undefined,
      type: 'PRODUCT',
      status: 'WON',
      amount: dealAmount,
      paymentType: suffix % 3 === 0 ? 'SUBSCRIPTION' : 'CLASSIC',
      sellerId: assignedSeller,
      source: 'MARKETING',
      productCategory: product.productCategory,
      productType: product.productType,
      pmId: product.pmId ?? ctx.pm.id,
      projectId: project.id,
    },
  });

  const orderStatus: OrderStatusEnum = archived
    ? 'FULLY_PAID'
    : suffix % 3 === 0
      ? 'PARTIALLY_PAID'
      : 'ACTIVE';

  const order = await prisma.order.create({
    data: {
      code: `ORD-2026-${padCode(10 + suffix)}`,
      projectId: project.id,
      dealId: deal.id,
      productId: product.id,
      type: 'PRODUCT',
      paymentType: deal.paymentType ?? 'CLASSIC',
      totalAmount: dealAmount,
      status: orderStatus,
      sellerBonusPercent: 3,
      deliveryBonusPercent: 2,
    },
  });

  const slice = suffix;
  const isActiveRichProject = !archived;
  const firstPaid = isActiveRichProject || slice % 2 === 0;
  const inv1 = await prisma.invoice.create({
    data: {
      code: `INV-2026-${padCode(30 + suffix * 2)}`,
      orderId: order.id,
      projectId: project.id,
      companyId: companyId ?? undefined,
      amount: Math.round(dealAmount * 0.5),
      type: 'DEVELOPMENT',
      moneyStatus: invoiceStatusForSlice(slice, firstPaid),
      dueDate: monthStart(2026, 3),
      paidDate: firstPaid ? monthStart(2026, 3) : null,
    },
  });
  const inv2 = await prisma.invoice.create({
    data: {
      code: `INV-2026-${padCode(30 + suffix * 2 + 1)}`,
      orderId: order.id,
      projectId: project.id,
      companyId: companyId ?? undefined,
      amount: dealAmount - Number(inv1.amount),
      type: 'DEVELOPMENT',
      moneyStatus: invoiceStatusForSlice(slice + 1, archived),
      dueDate: monthStart(2026, 5),
      paidDate: archived ? monthStart(2026, 4) : null,
    },
  });

  if (firstPaid) {
    await prisma.payment.create({
      data: {
        invoiceId: inv1.id,
        amount: inv1.amount,
        paymentDate: monthStart(2026, 3),
        paymentMethod: 'BANK_TRANSFER',
        confirmedBy: ctx.ceo.id,
      },
    });
  }
  if (archived) {
    await prisma.payment.create({
      data: {
        invoiceId: inv2.id,
        amount: inv2.amount,
        paymentDate: monthStart(2026, 4),
        paymentMethod: 'BANK_TRANSFER',
        confirmedBy: ctx.ceo.id,
      },
    });
  }

  if (isActiveRichProject) {
    await prisma.payment.create({
      data: {
        invoiceId: inv2.id,
        amount: inv2.amount,
        paymentDate: monthStart(2026, 4),
        paymentMethod: 'BANK_TRANSFER',
        confirmedBy: ctx.ceo.id,
        notes: 'Rich demo — fully funded for payroll matrix Avail',
      },
    });
    await prisma.invoice.update({
      where: { id: inv2.id },
      data: { moneyStatus: 'PAID', paidDate: monthStart(2026, 4) },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FULLY_PAID' },
    });
  }

  if (archived || product.status === 'DONE') {
    const subCode = `SUB-2026-${padCode(10 + suffix)}`;
    const sub = await prisma.subscription.create({
      data: {
        code: subCode,
        projectId: project.id,
        type: 'MAINTENANCE_ONLY',
        baseMonthlyAmount: 60_000 + suffix * 5_000,
        billingDay: 5,
        billingStartDate: monthStart(2026, 1),
        status: 'ACTIVE',
        taxStatus: 'TAX',
      },
    });
    await prisma.invoice.create({
      data: {
        code: `INV-2026-${padCode(80 + suffix)}`,
        subscriptionId: sub.id,
        projectId: project.id,
        companyId: companyId ?? undefined,
        amount: sub.baseMonthlyAmount,
        type: 'SUBSCRIPTION',
        moneyStatus: 'PAID',
        coverageStartMonth: coverageMonth(2026, 4),
        coverageMonthCount: 1,
        paidDate: monthStart(2026, 4),
      },
    });
  }

  const salesBonusAmount = Math.round(dealAmount * 0.03);
  const salesEarned = archived || firstPaid;
  const sellerHasKpi = assignedSeller === ctx.seller.id;
  await prisma.bonusEntry.create({
    data: {
      employeeId: assignedSeller,
      orderId: order.id,
      projectId: project.id,
      dealId: deal.id,
      type: 'SALES',
      amount: salesBonusAmount,
      percent: 3,
      status: archived ? 'PAID' : firstPaid ? 'EARNED' : 'INCOMING',
      earnedPeriod: salesEarned ? '2026-04' : null,
      kpiGatePassed: archived ? true : null,
      kpiPayoutFactor: salesEarned && sellerHasKpi ? 0.7 : null,
      payableAmount: salesEarned && sellerHasKpi ? Math.round(salesBonusAmount * 0.7) : null,
    },
  });

  if (!archived && suffix % 3 === 1) {
    await prisma.bonusEntry.create({
      data: {
        employeeId: product.pmId ?? ctx.pm.id,
        orderId: order.id,
        projectId: project.id,
        type: 'DELIVERY',
        amount: Math.round(dealAmount * 0.02),
        percent: 2,
        status: firstPaid ? 'EARNED' : 'INCOMING',
        earnedPeriod: firstPaid ? '2026-04' : null,
      },
    });
  }

  return {
    id: project.id,
    code,
    companyId,
    contactId,
    archived,
  };
}

async function seedExtraContacts(
  prisma: PrismaClient,
): Promise<{ contactIds: string[]; companyIds: (string | null)[] }> {
  const contactIds: string[] = [];
  const companyIds: (string | null)[] = [];

  for (let i = 0; i < 10; i += 1) {
    const id = `00000000-0000-0000-0001-${String(107 + i).padStart(12, '0')}`;
    const contact = await prisma.contact.create({
      data: {
        id,
        firstName: `Client${i + 7}`,
        lastName: 'Demo',
        email: `client${i + 7}@demo-client.am`,
        phone: `+3749900${String(1000 + i)}`,
        role: 'CLIENT',
      },
    });
    contactIds.push(contact.id);
    if (i % 2 === 0) {
      const company = await prisma.company.create({
        data: {
          name: `Demo Company ${i + 7} LLC`,
          type: 'LEGAL',
          taxStatus: i % 4 === 0 ? 'TAX_FREE' : 'TAX',
          contactId: contact.id,
        },
      });
      companyIds.push(company.id);
    } else {
      companyIds.push(null);
    }
  }

  return { contactIds, companyIds };
}

async function seedExpensePlansAndMoreExpenses(
  prisma: PrismaClient,
  projectIds: string[],
): Promise<void> {
  for (let i = 0; i < projectIds.length; i += 1) {
    const projectId = projectIds[i]!;
    const plan = await prisma.expensePlan.create({
      data: {
        name: `Hosting plan — slice ${i}`,
        category: 'HOSTING',
        amount: 18_000,
        frequency: 'MONTHLY',
        projectId,
        autoGenerate: true,
        nextDueDate: monthStart(2026, 5),
      },
    });
    const expense = await prisma.expense.create({
      data: {
        type: 'PLANNED',
        category: 'HOSTING',
        name: plan.name,
        amount: plan.amount,
        frequency: 'MONTHLY',
        status: i % 2 === 0 ? 'PAID' : 'DUE_SOON',
        projectId,
        expensePlanId: plan.id,
        dueDate: monthStart(2026, 5),
      },
    });
    if (i % 2 === 0) {
      await prisma.expensePayment.create({
        data: {
          expenseId: expense.id,
          amount: expense.amount,
          paymentDate: monthStart(2026, 4),
        },
      });
    }
  }

  await prisma.expense.create({
    data: {
      type: 'UNPLANNED',
      category: 'BONUS',
      name: 'Q1 team bonus reserve',
      amount: 200_000,
      frequency: 'ONE_TIME',
      status: 'PLANNED',
    },
  });
}

async function seedMay2026PayrollMatrix(
  prisma: PrismaClient,
  ctx: SeedRichDemoContext,
): Promise<void> {
  const mayRun = await prisma.payrollRun.findUnique({ where: { payrollMonth: '2026-05' } });
  if (!mayRun) return;

  const orderAcme = await prisma.order.findFirst({ where: { code: 'ORD-2026-0001' } });
  if (orderAcme) {
    const poolExists = await prisma.productBonusPool.findFirst({
      where: { orderId: orderAcme.id },
    });
    if (!poolExists) {
      await prisma.productBonusPool.create({
        data: {
          orderId: orderAcme.id,
          projectId: orderAcme.projectId,
          productId: orderAcme.productId,
          totalPlannedAmount: 125_000,
          totalReleasedAmount: 50_000,
          totalPaidAmount: 0,
          totalRemainingAmount: 75_000,
          availableFunding: 2_500_000,
          status: 'PARTIALLY_RELEASED',
        },
      });
    }

    const pmDelivery = await prisma.bonusEntry.findFirst({
      where: { orderId: orderAcme.id, employeeId: ctx.pm.id, type: 'DELIVERY' },
    });
    if (pmDelivery) {
      await prisma.bonusEntry.update({
        where: { id: pmDelivery.id },
        data: { earnedPeriod: '2026-04' },
      });
      await prisma.bonusRelease.create({
        data: {
          bonusEntryId: pmDelivery.id,
          payrollRunId: mayRun.id,
          employeeId: ctx.pm.id,
          projectId: orderAcme.projectId,
          amount: 50_000,
          payrollIncludedAmount: 50_000,
          releaseType: 'MANUAL',
          status: 'INCLUDED_IN_PAYROLL',
          reason: 'Early delivery bonus — May payroll seed',
          approvedById: ctx.ceo.id,
        },
      });
    }

    const annaSales = await prisma.bonusEntry.findFirst({
      where: { orderId: orderAcme.id, employeeId: ctx.seller.id, type: 'SALES' },
    });
    if (annaSales) {
      await prisma.bonusRelease.create({
        data: {
          bonusEntryId: annaSales.id,
          payrollRunId: mayRun.id,
          employeeId: ctx.seller.id,
          projectId: orderAcme.projectId,
          amount: 25_000,
          payrollIncludedAmount: 25_000,
          releaseType: 'AUTO',
          status: 'INCLUDED_IN_PAYROLL',
          approvedById: ctx.ceo.id,
        },
      });
    }
  }

  const orderStripe = await prisma.order.findFirst({ where: { code: 'ORD-2026-0020' } });
  if (orderStripe) {
    const deliveryEntry = await prisma.bonusEntry.findFirst({
      where: { orderId: orderStripe.id, type: 'DELIVERY' },
    });
    if (deliveryEntry) {
      await prisma.bonusEntry.update({
        where: { id: deliveryEntry.id },
        data: { earnedPeriod: '2026-04' },
      });
      const base = Number(deliveryEntry.amount);
      await prisma.bonusRelease.create({
        data: {
          bonusEntryId: deliveryEntry.id,
          payrollRunId: mayRun.id,
          employeeId: deliveryEntry.employeeId,
          projectId: orderStripe.projectId,
          amount: base + 5_000,
          payrollIncludedAmount: base + 5_000,
          releaseType: 'EXTRA',
          status: 'INCLUDED_IN_PAYROLL',
          reason: 'Extra bonus — May payroll seed',
          approvedById: ctx.ceo.id,
        },
      });
    }
  }

  const orderShopify = await prisma.order.findFirst({ where: { code: 'ORD-2026-0021' } });
  if (orderShopify) {
    const shopifySales = await prisma.bonusEntry.findFirst({
      where: { orderId: orderShopify.id, type: 'SALES' },
    });
    if (shopifySales) {
      await prisma.bonusRelease.create({
        data: {
          bonusEntryId: shopifySales.id,
          payrollRunId: mayRun.id,
          employeeId: shopifySales.employeeId,
          projectId: orderShopify.projectId,
          amount: 85_500,
          payrollIncludedAmount: 85_500,
          releaseType: 'OVER_FUNDING',
          status: 'INCLUDED_IN_PAYROLL',
          reason: 'Over funding demo — May payroll seed',
          approvedById: ctx.ceo.id,
        },
      });
    }
  }

  const levonSales = await prisma.bonusEntry.findFirst({
    where: { employeeId: ctx.seller2.id, type: 'SALES', earnedPeriod: '2026-04' },
  });
  if (levonSales) {
    await prisma.bonusRelease.create({
      data: {
        bonusEntryId: levonSales.id,
        payrollRunId: mayRun.id,
        employeeId: ctx.seller2.id,
        projectId: levonSales.projectId,
        amount: 40_000,
        payrollIncludedAmount: 40_000,
        releaseType: 'AUTO',
        status: 'INCLUDED_IN_PAYROLL',
        approvedById: ctx.ceo.id,
      },
    });
  }
}

async function syncSalaryLinesBonusesFromReleases(
  prisma: PrismaClient,
  payrollRunId: string,
): Promise<void> {
  const lines = await prisma.salaryLine.findMany({
    where: { payrollRunId },
    select: { id: true, employeeId: true, baseSalary: true, paidAmount: true, status: true },
  });

  let runTotalBonuses = 0;
  let runTotalPayable = 0;
  let runTotalPaid = 0;

  for (const line of lines) {
    const releases = await prisma.bonusRelease.findMany({
      where: {
        payrollRunId,
        employeeId: line.employeeId,
        status: 'INCLUDED_IN_PAYROLL',
      },
      select: { amount: true, payrollIncludedAmount: true },
    });

    const bonusesTotal = releases.reduce(
      (sum, rel) => sum + Number(rel.payrollIncludedAmount ?? rel.amount),
      0,
    );
    const base = Number(line.baseSalary);
    const totalPayable = base + bonusesTotal;
    const paid = Number(line.paidAmount);
    const remaining = Math.max(0, totalPayable - paid);

    await prisma.salaryLine.update({
      where: { id: line.id },
      data: {
        bonusesTotal,
        totalPayable,
        remainingAmount: remaining,
      },
    });

    runTotalBonuses += bonusesTotal;
    runTotalPayable += totalPayable;
    runTotalPaid += paid;
  }

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      totalBonuses: runTotalBonuses,
      totalPayable: runTotalPayable,
      totalPaid: runTotalPaid,
    },
  });
}

async function ensurePayableSnapshots(prisma: PrismaClient): Promise<void> {
  const entries = await prisma.bonusEntry.findMany({
    select: {
      id: true,
      amount: true,
      payableAmount: true,
      kpiPayoutFactor: true,
      payableAdjustment: true,
    },
  });

  for (const entry of entries) {
    if (entry.payableAmount != null) {
      continue;
    }
    const factor = entry.kpiPayoutFactor != null ? Number(entry.kpiPayoutFactor) : 1;
    const auto = Number(entry.amount) * factor;
    const adjustment = Number(entry.payableAdjustment);
    const payable = Math.max(0, Math.round((auto + adjustment) * 100) / 100);
    await prisma.bonusEntry.update({
      where: { id: entry.id },
      data: {
        kpiPayoutFactor: factor,
        payableAmount: payable,
        kpiGatePassed: factor > 0,
      },
    });
  }
}

/**
 * Expands NBOS demo data: ~20 projects, rich finance (orders→invoices→payments),
 * subscriptions, payroll, bonus pools, client services, expenses.
 */
export async function seedRichDemo(prisma: PrismaClient, ctx: SeedRichDemoContext): Promise<void> {
  console.log('  … Rich demo dataset');

  const extra = await seedExtraContacts(prisma);
  const allContactIds = [...ctx.contactIds, ...extra.contactIds];
  const allCompanyIds = [...ctx.companyIds, ...extra.companyIds];

  const newProjects: CreatedProject[] = [];
  for (let n = RICH_PROJECT_START; n <= RICH_PROJECT_END; n += 1) {
    const contactId = allContactIds[(n - RICH_PROJECT_START) % allContactIds.length]!;
    const companyId = allCompanyIds[(n - RICH_PROJECT_START) % allCompanyIds.length] ?? null;
    const created = await createRichProjectBundle(prisma, ctx, n, contactId, companyId);
    newProjects.push(created);
  }

  const allProjectIds = [...ctx.existing.projectIds, ...newProjects.map((p) => p.id)];
  await seedClientServicesForProjects(prisma, allProjectIds.slice(0, 12));
  await seedSubscriptionHistory(prisma, ctx);

  const unpaidInvoices = await prisma.invoice.findMany({
    where: { moneyStatus: 'AWAITING_PAYMENT' },
    take: 6,
  });
  for (const inv of unpaidInvoices) {
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        amount: inv.amount,
        paymentDate: monthStart(2026, 4),
        paymentMethod: 'CARD',
        confirmedBy: ctx.ceo.id,
        notes: 'Partial demo settlement',
      },
    });
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { moneyStatus: 'PAID', paidDate: monthStart(2026, 4) },
    });
  }

  await seedExpensePlansAndMoreExpenses(prisma, allProjectIds);
  const compensationByEmployee = await seedCompensationProfiles(prisma, ctx);
  await seedPayrollAndSalaries(prisma, ctx, compensationByEmployee);
  await seedBonusPoolsAndReleases(prisma, ctx);
  await seedMay2026PayrollMatrix(prisma, ctx);
  const runsWithIncludedReleases = await prisma.payrollRun.findMany({
    where: { bonusReleases: { some: { status: 'INCLUDED_IN_PAYROLL' } } },
    select: { id: true },
  });
  for (const run of runsWithIncludedReleases) {
    await syncSalaryLinesBonusesFromReleases(prisma, run.id);
  }
  await syncAllProductBonusPools(prisma);
  await ensurePayableSnapshots(prisma);
  await archiveHalfOfProjects(prisma);

  console.log(
    `  ✓ Rich demo: ${RICH_PROJECT_END} projects, payroll (5 months), pools, client services`,
  );
}
