import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  CREDENTIAL_CATEGORY_CODES,
  findAccessSlotDefinition,
  getAccessSlotsForProduct,
  isCategoryAllowedForSlot,
  resolveEffectiveAccessSlotKey,
  UNIVERSAL_ACCESS_SLOT_KEY,
  type AccessSlotDefinition,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';

const KNOWN_ORPHAN_SLOT_LABELS: Record<string, string> = {
  DOMAIN: 'Domain account',
  HOSTING: 'Hosting account',
  ADMIN: 'Admin / CMS access',
  MAIL: 'Mail account',
  SERVICE: 'Service account',
  API_INTEGRATION: 'API / integration',
  APP_STORE: 'App store account',
  DATABASE: 'Database access',
  [UNIVERSAL_ACCESS_SLOT_KEY]: 'Other / not listed',
};

export type AccessSlotBindingEntry = {
  bindingId: string;
  boundCredential: {
    id: string;
    name: string;
    category: string;
    credentialType: string;
    login: string | null;
    url: string | null;
  } | null;
};

export type ProductAccessSlotRowDto = {
  slotKey: string;
  label: string;
  required: boolean;
  kind: 'credential';
  allowedCategories: string[];
  defaultCredentialType: string | null;
  bindings: AccessSlotBindingEntry[];
};

@Injectable()
export class ProductAccessSlotBindingsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getProductAccessSlots(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        projectId: true,
        productCategory: true,
        productType: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const definitions = getAccessSlotsForProduct(product.productCategory, product.productType);
    const definitionKeys = new Set(definitions.map((d) => d.slotKey));

    const bindings = await this.prisma.productAccessSlotBinding.findMany({
      where: { productId },
      orderBy: [{ slotKey: 'asc' }, { createdAt: 'asc' }],
      include: {
        credential: {
          select: {
            id: true,
            name: true,
            category: true,
            credentialType: true,
            login: true,
            url: true,
            trashedAt: true,
          },
        },
      },
    });

    const bySlot = new Map<string, typeof bindings>();
    for (const b of bindings) {
      const list = bySlot.get(b.slotKey) ?? [];
      list.push(b);
      bySlot.set(b.slotKey, list);
    }

    const rows: ProductAccessSlotRowDto[] = definitions.map((def) =>
      this.mapDefinitionToRow(def, bySlot.get(def.slotKey) ?? []),
    );

    const orphanKeys = [...bySlot.keys()].filter((k) => !definitionKeys.has(k));
    for (const slotKey of orphanKeys.sort()) {
      rows.push(this.orphanRow(slotKey, bySlot.get(slotKey) ?? []));
    }

    return {
      productId: product.id,
      slots: rows,
    };
  }

  private mapDefinitionToRow(
    def: AccessSlotDefinition,
    slotBindings: Array<{
      id: string;
      credential: {
        id: string;
        name: string;
        category: string;
        credentialType: string;
        login: string | null;
        url: string | null;
        trashedAt: Date | null;
      };
    }>,
  ): ProductAccessSlotRowDto {
    return {
      slotKey: def.slotKey,
      label: def.label,
      required: def.required,
      kind: def.kind,
      allowedCategories: [...def.allowedCategories],
      defaultCredentialType: def.defaultCredentialType ?? null,
      bindings: slotBindings.map((b) => ({
        bindingId: b.id,
        boundCredential: this.toSummary(b.credential),
      })),
    };
  }

  private orphanRow(
    slotKey: string,
    slotBindings: Array<{
      id: string;
      credential: {
        id: string;
        name: string;
        category: string;
        credentialType: string;
        login: string | null;
        url: string | null;
        trashedAt: Date | null;
      };
    }>,
  ): ProductAccessSlotRowDto {
    return {
      slotKey,
      label: KNOWN_ORPHAN_SLOT_LABELS[slotKey] ?? slotKey,
      required: false,
      kind: 'credential',
      allowedCategories: [...CREDENTIAL_CATEGORY_CODES],
      defaultCredentialType: null,
      bindings: slotBindings.map((b) => ({
        bindingId: b.id,
        boundCredential: this.toSummary(b.credential),
      })),
    };
  }

  private toSummary(cred: {
    trashedAt: Date | null;
    id: string;
    name: string;
    category: string;
    credentialType: string;
    login: string | null;
    url: string | null;
  }): AccessSlotBindingEntry['boundCredential'] {
    if (cred.trashedAt) return null;
    return {
      id: cred.id,
      name: cred.name,
      category: cred.category,
      credentialType: cred.credentialType,
      login: cred.login,
      url: cred.url,
    };
  }

  async bindProductAccessSlot(productId: string, requestedSlotKey: string, credentialId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        projectId: true,
        productCategory: true,
        productType: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const requestedDef = findAccessSlotDefinition(
      product.productCategory,
      product.productType,
      requestedSlotKey,
    );
    if (!requestedDef) {
      throw new BadRequestException(`Unknown access slot for this product: ${requestedSlotKey}`);
    }

    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
    });
    if (!credential || credential.trashedAt) {
      throw new NotFoundException('Credential not found');
    }
    if (!credential.projectId || credential.projectId !== product.projectId) {
      throw new ForbiddenException('Credential must belong to this product project');
    }
    if (!isCategoryAllowedForSlot(requestedDef, credential.category)) {
      throw new BadRequestException(
        `Credential category ${credential.category} is not allowed for requested slot ${requestedSlotKey}`,
      );
    }

    const effectiveSlotKey = resolveEffectiveAccessSlotKey(
      product.productCategory,
      product.productType,
      requestedSlotKey,
      credential.category,
    );

    const effectiveDef = findAccessSlotDefinition(
      product.productCategory,
      product.productType,
      effectiveSlotKey,
    );
    if (!effectiveDef) {
      throw new BadRequestException(
        `Resolved slot is not valid for this product: ${effectiveSlotKey}`,
      );
    }
    if (!isCategoryAllowedForSlot(effectiveDef, credential.category)) {
      throw new BadRequestException(
        `Credential category ${credential.category} is not allowed for slot ${effectiveSlotKey}`,
      );
    }

    const existingForCredential = await this.prisma.productAccessSlotBinding.findFirst({
      where: { productId, credentialId },
    });
    if (existingForCredential) {
      throw new BadRequestException(
        'This credential is already linked to an access slot for this product. Unlink it first.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productAccessSlotBinding.create({
        data: { productId, slotKey: effectiveSlotKey, credentialId },
      });
      await tx.credential.update({
        where: { id: credentialId },
        data: { productId },
      });
    });

    const slotsPayload = await this.getProductAccessSlots(productId);
    return {
      ...slotsPayload,
      bindMeta: {
        requestedSlotKey,
        effectiveSlotKey,
        effectiveSlotLabel: effectiveDef.label,
      },
    };
  }

  async unbindProductAccessSlotBinding(productId: string, bindingId: string) {
    const row = await this.prisma.productAccessSlotBinding.findFirst({
      where: { id: bindingId, productId },
    });
    if (!row) throw new NotFoundException('Binding not found');

    await this.prisma.productAccessSlotBinding.delete({ where: { id: bindingId } });
    return this.getProductAccessSlots(productId);
  }
}
