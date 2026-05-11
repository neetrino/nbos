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
  getAccessSlotsForProduct,
  isCategoryAllowedForSlot,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';

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
    const bindings = await this.prisma.productAccessSlotBinding.findMany({
      where: { productId },
      include: {
        credential: {
          select: {
            id: true,
            name: true,
            category: true,
            credentialType: true,
            login: true,
            url: true,
            archivedAt: true,
          },
        },
      },
    });
    const bySlot = new Map(bindings.map((b) => [b.slotKey, b]));

    return {
      productId: product.id,
      slots: definitions.map((def) => {
        const row = bySlot.get(def.slotKey);
        const cred = row?.credential ?? null;
        const summary =
          cred && !cred.archivedAt
            ? {
                id: cred.id,
                name: cred.name,
                category: cred.category,
                credentialType: cred.credentialType,
                login: cred.login,
                url: cred.url,
              }
            : null;
        return {
          slotKey: def.slotKey,
          label: def.label,
          required: def.required,
          kind: def.kind,
          allowedCategories: [...def.allowedCategories],
          defaultCredentialType: def.defaultCredentialType ?? null,
          boundCredential: summary,
        };
      }),
    };
  }

  async bindProductAccessSlot(productId: string, slotKey: string, credentialId: string) {
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

    const def = findAccessSlotDefinition(product.productCategory, product.productType, slotKey);
    if (!def) {
      throw new BadRequestException(`Unknown access slot for this product: ${slotKey}`);
    }

    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
    });
    if (!credential || credential.archivedAt) {
      throw new NotFoundException('Credential not found');
    }
    if (!credential.projectId || credential.projectId !== product.projectId) {
      throw new ForbiddenException('Credential must belong to this product project');
    }
    if (!isCategoryAllowedForSlot(def, credential.category)) {
      throw new BadRequestException(
        `Credential category ${credential.category} is not allowed for slot ${slotKey}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productAccessSlotBinding.deleteMany({
        where: {
          productId,
          credentialId,
          slotKey: { not: slotKey },
        },
      });
      await tx.productAccessSlotBinding.upsert({
        where: {
          productId_slotKey: { productId, slotKey },
        },
        create: { productId, slotKey, credentialId },
        update: { credentialId },
      });
      await tx.credential.update({
        where: { id: credentialId },
        data: { productId },
      });
    });

    return this.getProductAccessSlots(productId);
  }

  async unbindProductAccessSlot(productId: string, slotKey: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productCategory: true, productType: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const def = findAccessSlotDefinition(product.productCategory, product.productType, slotKey);
    if (!def) {
      throw new BadRequestException(`Unknown access slot for this product: ${slotKey}`);
    }

    await this.prisma.productAccessSlotBinding.deleteMany({
      where: { productId, slotKey },
    });

    return this.getProductAccessSlots(productId);
  }
}
