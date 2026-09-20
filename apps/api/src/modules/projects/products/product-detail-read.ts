import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  loadStageChecklistProgressByOwner,
  pickProgressForEntity,
} from '../../checklist-templates/checklist-instance-stage-progress';
import { attachProductDeliveryLifecycle } from '../delivery-lifecycle';
import { buildProductDoneReadiness } from './product-done-readiness';
import { PRODUCT_DETAIL_INCLUDE } from './product-detail-select';

export async function findProductById(prisma: InstanceType<typeof PrismaClient>, id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_DETAIL_INCLUDE,
  });
  if (!product) throw new NotFoundException(`Product ${id} not found`);
  const { workSpace, ...productRecord } = product;
  const checklistProgressMap = await loadStageChecklistProgressByOwner(prisma, [
    {
      ownerEntityType: 'PRODUCT',
      ownerEntityId: productRecord.id,
      stage: attachProductDeliveryLifecycle(productRecord).deliveryLifecycle.stage,
    },
  ]);
  const withLc = attachProductDeliveryLifecycle(productRecord);
  const checklistStageProgress = pickProgressForEntity(
    checklistProgressMap,
    'PRODUCT',
    productRecord.id,
    withLc.deliveryLifecycle.stage,
  );
  return {
    ...withLc,
    workSpaceId: workSpace?.id ?? null,
    doneReadiness: buildProductDoneReadiness(productRecord),
    checklistStageProgress,
  };
}
