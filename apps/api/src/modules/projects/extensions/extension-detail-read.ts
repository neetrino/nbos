import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  loadStageChecklistProgressByOwner,
  pickProgressForEntity,
} from '../../checklist-templates/checklist-instance-stage-progress';
import { attachExtensionReadiness } from './extension-stage-gates';
import { EXTENSION_DETAIL_INCLUDE } from './extension-detail-select';

export async function findExtensionById(prisma: InstanceType<typeof PrismaClient>, id: string) {
  const extension = await prisma.extension.findUnique({
    where: { id },
    include: EXTENSION_DETAIL_INCLUDE,
  });
  if (!extension) throw new NotFoundException(`Extension ${id} not found`);
  const base = attachExtensionReadiness(extension);
  const checklistProgressMap = await loadStageChecklistProgressByOwner(prisma, [
    {
      ownerEntityType: 'EXTENSION',
      ownerEntityId: extension.id,
      stage: attachExtensionReadiness(extension).deliveryLifecycle.stage,
    },
  ]);
  return {
    ...base,
    checklistStageProgress: pickProgressForEntity(
      checklistProgressMap,
      'EXTENSION',
      extension.id,
      base.deliveryLifecycle.stage,
    ),
  };
}
