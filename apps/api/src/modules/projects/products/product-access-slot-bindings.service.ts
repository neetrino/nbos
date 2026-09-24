import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  findAccessSlotDefinition,
  isCategoryAllowedForSlot,
  isCredentialBindableToProductProject,
  resolveEffectiveAccessSlotKey,
  shouldWriteCredentialProductIdOnBind,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import type { CredentialsAccessContext } from '../../credentials/credentials-access';
import { PlatformAccessResolverService } from '../../platform-access/platform-access-resolver.service';
import {
  BINDING_CREDENTIAL_SELECT,
  buildAccessSlotRows,
  type ProductAccessSlotRowDto,
} from './product-access-slot-rows';
import {
  ACCESS_SLOT_CANDIDATE_PAGE_SIZE,
  buildAccessSlotCandidateWhere,
  pageAccessSlotCandidates,
} from './product-access-slot-candidates';
import {
  buildAccessSlotVisibilityWhere,
  loadRevealableCredentialIds,
} from './product-access-slot-revealable';

export type { AccessSlotBindingEntry, ProductAccessSlotRowDto } from './product-access-slot-rows';

export type AccessSlotCandidateDto = {
  id: string;
  name: string;
  category: string;
  login: string | null;
  provider: string | null;
};

@Injectable()
export class ProductAccessSlotBindingsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly platformAccessResolver: PlatformAccessResolverService,
  ) {}

  async getProductAccessSlots(productId: string, access: CredentialsAccessContext) {
    const { product, rows } = await this.loadSlotRows(productId, access);
    return { productId: product.id, slots: rows };
  }

  async listAccessSlotCandidates(
    productId: string,
    slotKey: string,
    search: string | undefined,
    access: CredentialsAccessContext,
  ): Promise<{ items: AccessSlotCandidateDto[]; hasMore: boolean }> {
    if (!slotKey?.trim()) {
      throw new BadRequestException('slotKey is required');
    }
    const product = await this.requireProduct(productId);
    const requestedDef = findAccessSlotDefinition(
      product.productCategory,
      product.productType,
      slotKey,
    );
    if (!requestedDef) {
      throw new BadRequestException(`Unknown access slot for this product: ${slotKey}`);
    }

    const bound = await this.prisma.productAccessSlotBinding.findMany({
      where: { productId },
      select: { credentialId: true },
    });
    const visibility = await buildAccessSlotVisibilityWhere(
      this.prisma,
      this.platformAccessResolver,
      access,
    );
    const rows = await this.prisma.credential.findMany({
      where: buildAccessSlotCandidateWhere({
        productProjectId: product.projectId,
        allowedCategories: requestedDef.allowedCategories,
        excludeCredentialIds: bound.map((row) => row.credentialId),
        visibility,
        search,
      }),
      select: {
        id: true,
        name: true,
        category: true,
        login: true,
        provider: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      take: ACCESS_SLOT_CANDIDATE_PAGE_SIZE + 1,
    });
    return pageAccessSlotCandidates(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        login: row.login,
        provider: row.provider?.name ?? null,
      })),
    );
  }

  async bindProductAccessSlot(
    productId: string,
    requestedSlotKey: string,
    credentialId: string,
    access: CredentialsAccessContext,
  ) {
    const product = await this.requireProduct(productId);
    const { credential, effectiveDef, effectiveSlotKey } = await this.assertBindable(
      product,
      requestedSlotKey,
      credentialId,
    );
    const writeProductId = shouldWriteCredentialProductIdOnBind({
      credentialProjectId: credential.projectId,
      credentialProductId: credential.productId,
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.productAccessSlotBinding.create({
        data: { productId, slotKey: effectiveSlotKey, credentialId },
      });
      if (writeProductId) {
        await tx.credential.update({ where: { id: credentialId }, data: { productId } });
      }
    });
    const slotsPayload = await this.getProductAccessSlots(productId, access);
    return {
      ...slotsPayload,
      bindMeta: {
        requestedSlotKey,
        effectiveSlotKey,
        effectiveSlotLabel: effectiveDef.label,
      },
    };
  }

  async unbindProductAccessSlotBinding(
    productId: string,
    bindingId: string,
    access: CredentialsAccessContext,
  ) {
    const row = await this.prisma.productAccessSlotBinding.findFirst({
      where: { id: bindingId, productId },
    });
    if (!row) throw new NotFoundException('Binding not found');
    await this.prisma.productAccessSlotBinding.delete({ where: { id: bindingId } });
    return this.getProductAccessSlots(productId, access);
  }

  private async assertBindable(
    product: {
      id: string;
      projectId: string;
      productCategory: string;
      productType: string;
      productPlatform?: string | null;
    },
    requestedSlotKey: string,
    credentialId: string,
  ) {
    const requestedDef = findAccessSlotDefinition(
      product.productCategory,
      product.productType,
      requestedSlotKey,
      product.productPlatform,
    );
    if (!requestedDef) {
      throw new BadRequestException(`Unknown access slot for this product: ${requestedSlotKey}`);
    }
    const credential = await this.prisma.credential.findUnique({ where: { id: credentialId } });
    if (!credential || credential.trashedAt) {
      throw new NotFoundException('Credential not found');
    }
    if (!isCredentialBindableToProductProject(credential.projectId, product.projectId)) {
      throw new ForbiddenException('Credential must belong to this product project');
    }
    if (!isCategoryAllowedForSlot(requestedDef, credential.category)) {
      throw new BadRequestException(
        `Credential category ${credential.category} is not allowed for requested slot ${requestedSlotKey}`,
      );
    }
    const existingForCredential = await this.prisma.productAccessSlotBinding.findFirst({
      where: { productId: product.id, credentialId },
    });
    if (existingForCredential) {
      throw new BadRequestException(
        'This credential is already linked to an access slot for this product. Unlink it first.',
      );
    }
    const effectiveSlotKey = resolveEffectiveAccessSlotKey(
      product.productCategory,
      product.productType,
      requestedSlotKey,
      credential.category,
      product.productPlatform,
    );
    const effectiveDef = findAccessSlotDefinition(
      product.productCategory,
      product.productType,
      effectiveSlotKey,
      product.productPlatform,
    );
    if (!effectiveDef || !isCategoryAllowedForSlot(effectiveDef, credential.category)) {
      throw new BadRequestException(
        `Credential category ${credential.category} is not allowed for slot ${effectiveSlotKey}`,
      );
    }
    return { credential, effectiveDef, effectiveSlotKey };
  }

  private async requireProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        projectId: true,
        productCategory: true,
        productType: true,
        productPlatform: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async loadSlotRows(productId: string, access: CredentialsAccessContext) {
    const product = await this.requireProduct(productId);
    const bindings = await this.prisma.productAccessSlotBinding.findMany({
      where: { productId },
      orderBy: [{ slotKey: 'asc' }, { createdAt: 'asc' }],
      include: { credential: { select: BINDING_CREDENTIAL_SELECT } },
    });
    const revealable = await loadRevealableCredentialIds(
      this.prisma,
      this.platformAccessResolver,
      access,
      bindings.map((row) => row.credential.id),
    );
    const rows: ProductAccessSlotRowDto[] = buildAccessSlotRows(
      product.productCategory,
      product.productType,
      bindings,
      revealable,
      product.productPlatform,
    );
    return { product, rows };
  }
}
