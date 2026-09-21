import {
  PrismaClient,
  type Prisma,
  type DeliveryResolutionEnum,
  type DeliveryStageEnum,
  type DeliveryWorkStatusEnum,
  type ExtensionSizeEnum,
  type ExtensionStatusEnum,
} from '@nbos/database';
import {
  loadStageChecklistProgressByOwner,
  pickProgressForEntity,
} from '../../checklist-templates/checklist-instance-stage-progress';
import { mergeActiveParentProjectScope } from '../active-project-list-scope';
import { extensionBillingCompanyWhere } from '../products/product-billing-company.where';
import { batchExtensionOpenTaskCounts } from './batch-extension-open-task-counts';
import { buildExtensionCurrentStageReadiness } from './extension-current-stage-readiness';
import { attachExtensionReadiness } from './extension-stage-gates';
import { EXTENSION_LIST_INCLUDE } from './extension-detail-select';

export interface ExtensionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  /** Filter by parent product billing company, falling back to the project default. */
  companyId?: string;
  productId?: string;
  status?: string;
  deliveryStage?: string;
  deliveryWorkStatus?: string;
  deliveryResolution?: string;
  size?: string;
  assignedTo?: string;
  search?: string;
}

export async function findAllExtensions(
  prisma: InstanceType<typeof PrismaClient>,
  params: ExtensionQueryParams,
) {
  const {
    page = 1,
    pageSize = 20,
    projectId,
    companyId,
    productId,
    status,
    deliveryStage,
    deliveryWorkStatus,
    deliveryResolution,
    size,
    assignedTo,
    search,
  } = params;
  const where: Prisma.ExtensionWhereInput = {};

  if (projectId) where.projectId = projectId;
  if (companyId) {
    Object.assign(where, extensionBillingCompanyWhere(companyId));
  }
  if (productId) where.productId = productId;
  if (status) where.status = status as ExtensionStatusEnum;
  if (deliveryStage) where.deliveryStage = deliveryStage as DeliveryStageEnum;
  if (deliveryWorkStatus) {
    where.deliveryWorkStatus = deliveryWorkStatus as DeliveryWorkStatusEnum;
  }
  if (deliveryResolution) {
    where.deliveryResolution = deliveryResolution as DeliveryResolutionEnum;
  }
  if (size) where.size = size as ExtensionSizeEnum;
  if (assignedTo) where.assignedTo = assignedTo;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const scopedWhere = mergeActiveParentProjectScope(where, { projectId });

  const [items, total] = await Promise.all([
    prisma.extension.findMany({
      where: scopedWhere,
      include: EXTENSION_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.extension.count({ where: scopedWhere }),
  ]);

  const openTasksByExt = await batchExtensionOpenTaskCounts(
    prisma,
    items.map((e) => e.id),
  );

  const lifecycleByExtension = new Map(
    items.map((extension) => [extension.id, attachExtensionReadiness(extension)]),
  );
  const checklistProgressMap = await loadStageChecklistProgressByOwner(
    prisma,
    items.map((extension) => ({
      ownerEntityType: 'EXTENSION' as const,
      ownerEntityId: extension.id,
      stage: lifecycleByExtension.get(extension.id)?.deliveryLifecycle.stage ?? null,
    })),
  );

  return {
    items: items.map((extension) => {
      const base = lifecycleByExtension.get(extension.id) ?? attachExtensionReadiness(extension);
      const openTasks = openTasksByExt.get(extension.id) ?? 0;
      const readiness = buildExtensionCurrentStageReadiness(extension, base.deliveryLifecycle, {
        openTasks,
      });
      const checklistStageProgress = pickProgressForEntity(
        checklistProgressMap,
        'EXTENSION',
        extension.id,
        base.deliveryLifecycle.stage,
      );
      const currentStageReadiness = mergeChecklistIntoReadiness(readiness, checklistStageProgress);
      return {
        ...base,
        deliveryLifecycle: {
          ...base.deliveryLifecycle,
          ...(currentStageReadiness ? { currentStageReadiness } : {}),
        },
        checklistStageProgress,
      };
    }),
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

function mergeChecklistIntoReadiness(
  readiness: { completed: number; total: number } | undefined,
  checklist: { completedChecklists?: number; totalChecklists?: number } | null,
) {
  if (!checklist?.totalChecklists) return readiness;
  const base = readiness ?? { completed: 0, total: 0 };
  const completedChecklists = checklist.completedChecklists ?? 0;
  const totalChecklists = checklist.totalChecklists;
  return {
    completed: base.completed + (completedChecklists >= totalChecklists ? totalChecklists : 0),
    total: base.total + totalChecklists,
  };
}
