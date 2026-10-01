import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../../common/decorators';
import { registerProduct } from './product-registration';
import { parseRegisterProduct, type RegisterProductDto } from './register-product.dto';

vi.mock('../../../common/utils/entity-code-series', () => ({
  allocateProjectCode: vi.fn().mockResolvedValue('P-2026-0001'),
}));
const CONTACT = '11111111-1111-4111-8111-111111111111';
const PROJECT = '22222222-2222-4222-8222-222222222222';
const COMPANY = '33333333-3333-4333-8333-333333333333';
const user = { permissions: { PROJECTS_ADD: 'ALL', CLIENTS_ADD: 'ALL' } } as CurrentUserPayload;
const input: RegisterProductDto = {
  name: ' DeGusto ',
  productCategory: 'CODE',
  productType: 'ECOMMERCE',
  productPlatform: 'WEB',
  contactId: CONTACT,
  createProject: true,
  startDelivery: false,
};

function harness() {
  const tx = {
    contact: { findFirst: vi.fn().mockResolvedValue({ id: CONTACT }) },
    company: {
      findFirst: vi.fn().mockResolvedValue({ id: COMPANY }),
      create: vi.fn().mockResolvedValue({ id: COMPANY }),
    },
    project: {
      findFirst: vi.fn().mockResolvedValue({ id: PROJECT, companyId: COMPANY, contactId: CONTACT }),
      findUnique: vi.fn().mockResolvedValue({ id: PROJECT, contactId: CONTACT, trashedAt: null }),
      create: vi.fn().mockResolvedValue({ id: PROJECT }),
    },
    projectAdditionalContact: { createMany: vi.fn() },
    product: { create: vi.fn().mockResolvedValue({ id: 'product', deliveryEnabled: false }) },
  };
  const transaction = vi.fn(async (run: (client: typeof tx) => Promise<unknown>) => run(tx));
  return {
    tx,
    prisma: { $transaction: transaction } as unknown as InstanceType<typeof PrismaClient>,
    transaction,
  };
}

describe('product registration', () => {
  it('creates project, company and product in one transaction without delivery or order', async () => {
    const { prisma, tx, transaction } = harness();
    await registerProduct(prisma, { ...input, createCompany: true, taxStatus: 'TAX_FREE' }, user);
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.project.create).toHaveBeenCalledWith({
      data: { name: 'DeGusto', code: 'P-2026-0001', contactId: CONTACT, companyId: COMPANY },
    });
    expect(tx.company.create).toHaveBeenCalledWith({
      data: { name: 'DeGusto', contactId: CONTACT, taxStatus: 'TAX_FREE' },
    });
    expect(tx.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'DeGusto',
        projectId: PROJECT,
        companyId: COMPANY,
        deliveryEnabled: false,
        deliveryStage: null,
        deliveryResolution: null,
      }),
    });
  });

  it('reuses the project/company and adds a different contact to the project', async () => {
    const { prisma, tx } = harness();
    tx.project.findUnique.mockResolvedValue({
      id: PROJECT,
      contactId: 'other-contact',
      trashedAt: null,
    });
    await registerProduct(prisma, { ...input, createProject: false, projectId: PROJECT }, user);
    expect(tx.project.create).not.toHaveBeenCalled();
    expect(tx.company.create).not.toHaveBeenCalled();
    expect(tx.projectAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ projectId: PROJECT, contactId: CONTACT }],
      skipDuplicates: true,
    });
    expect(tx.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: COMPANY }),
    });
  });

  it('supports explicit development and an explicitly empty billing company', async () => {
    const { prisma, tx } = harness();
    await registerProduct(
      prisma,
      { ...input, createProject: false, projectId: PROJECT, companyId: null, startDelivery: true },
      user,
    );
    expect(tx.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: null,
        deliveryEnabled: true,
        deliveryStage: 'STARTING',
      }),
    });
  });

  it('rejects company creation without Clients ADD before any writes', async () => {
    const { prisma, transaction } = harness();
    await expect(
      registerProduct(prisma, { ...input, createCompany: true }, {
        permissions: { PROJECTS_ADD: 'ALL' },
      } as CurrentUserPayload),
    ).rejects.toThrow('CLIENTS.ADD');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects missing project permissions', async () => {
    const { prisma, transaction } = harness();
    await expect(
      registerProduct(prisma, input, { permissions: {} } as CurrentUserPayload),
    ).rejects.toThrow('PROJECTS.ADD');
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects an unavailable project before creating company or product', async () => {
    const { prisma, tx } = harness();
    tx.project.findFirst.mockResolvedValue(null);
    await expect(
      registerProduct(
        prisma,
        { ...input, createProject: false, projectId: PROJECT, createCompany: true },
        user,
      ),
    ).rejects.toThrow('Project not found');
    expect(tx.company.create).not.toHaveBeenCalled();
    expect(tx.product.create).not.toHaveBeenCalled();
  });

  it('propagates a failed product insert out of the transaction', async () => {
    const { prisma, tx } = harness();
    tx.product.create.mockRejectedValue(new Error('insert failed'));
    await expect(registerProduct(prisma, { ...input, createCompany: true }, user)).rejects.toThrow(
      'insert failed',
    );
  });

  it.each([
    { ...input, projectId: PROJECT },
    { ...input, createProject: false },
    { ...input, companyId: COMPANY, createCompany: true },
    { ...input, name: '  ' },
    { ...input, contactId: 'bad-id' },
    { ...input, startDelivery: 'false' },
  ])('rejects ambiguous or invalid input %#', (data) => {
    expect(() => parseRegisterProduct(data as RegisterProductDto)).toThrow();
  });
});

describe('denied permission scopes', () => {
  it.each([
    { PROJECTS_ADD: 'NONE', CLIENTS_ADD: 'ALL' },
    { PROJECTS_ADD: 'ALL', CLIENTS_ADD: 'NONE' },
  ])('rejects explicit NONE grants', async (permissions) => {
    const { prisma, transaction } = harness();
    await expect(
      registerProduct(prisma, { ...input, createCompany: true }, {
        permissions,
      } as CurrentUserPayload),
    ).rejects.toThrow('No permission');
    expect(transaction).not.toHaveBeenCalled();
  });
});
