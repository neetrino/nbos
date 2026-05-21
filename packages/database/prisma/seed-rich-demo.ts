import type { PrismaClient } from '../src/generated/prisma/client';
import type {
  InvoiceMoneyStatusEnum,
  OrderStatusEnum,
  ProductStatusEnum,
} from '../src/generated/prisma/enums';

const RICH_PROJECT_START = 6;
const RICH_PROJECT_END = 20;
const ARCHIVED_PROJECT_SUFFIXES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

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
      data: { isArchived: true },
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
  }> = [
    { employeeId: ctx.ceo.id, baseSalary: 850_000, notes: 'CEO fixed monthly' },
    { employeeId: ctx.seller.id, baseSalary: 480_000, notes: 'Senior seller base' },
    { employeeId: ctx.pm.id, baseSalary: 620_000, notes: 'Senior PM base' },
    { employeeId: ctx.pm2.id, baseSalary: 520_000, notes: 'Middle PM base' },
    { employeeId: ctx.dev.id, baseSalary: 580_000, notes: 'Middle developer base' },
    { employeeId: ctx.designer.id, baseSalary: 450_000, notes: 'Designer base' },
  ];

  const byEmployee: Record<string, string> = {};
  for (const row of profiles) {
    const profile = await prisma.compensationProfile.create({
      data: {
        employeeId: row.employeeId,
        baseSalary: row.baseSalary,
        currency: 'AMD',
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
  const employees = [ctx.ceo, ctx.seller, ctx.pm, ctx.pm2, ctx.dev, ctx.designer];
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
      const deductions = emp.id === ctx.ceo.id ? 0 : 15_000;
      const payable = base + bonuses - deductions;
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
          deductionsTotal: deductions,
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
        totalDeductions: employees.length * 15_000 - 15_000,
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
          billingModel: t === 0 ? 'CLIENT_PAID' : 'COMPANY_PAID',
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
  const project = await prisma.project.create({
    data: {
      code,
      name: `Demo Client ${suffix} — ${archived ? 'Closed engagement' : 'Active engagement'}`,
      contactId,
      companyId: companyId ?? undefined,
      description: archived
        ? 'Archived project with completed delivery and maintenance.'
        : 'Active delivery and recurring maintenance.',
      isArchived: archived,
    },
  });

  const productStatuses = archived ? PRODUCT_STATUSES_CLOSED : PRODUCT_STATUSES_ACTIVE;
  const dealAmount = 1_200_000 + suffix * 150_000;
  const product = await prisma.product.create({
    data: {
      projectId: project.id,
      name: `${project.name} — Primary deliverable`,
      productCategory: suffix % 2 === 0 ? 'CODE' : 'MARKETING',
      productType: suffix % 2 === 0 ? 'WEB_APP' : 'COMPANY_WEBSITE',
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
      sellerId: ctx.seller.id,
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
  const firstPaid = archived || slice % 2 === 0;
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

  await prisma.bonusEntry.create({
    data: {
      employeeId: ctx.seller.id,
      orderId: order.id,
      projectId: project.id,
      dealId: deal.id,
      type: 'SALES',
      amount: Math.round(dealAmount * 0.03),
      percent: 3,
      status: archived ? 'PAID' : firstPaid ? 'EARNED' : 'INCOMING',
      kpiGatePassed: archived ? true : null,
    },
  });

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
  await archiveHalfOfProjects(prisma);

  console.log(
    `  ✓ Rich demo: ${RICH_PROJECT_END} projects, payroll (5 months), pools, client services`,
  );
}
