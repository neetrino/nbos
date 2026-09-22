import {
  PrismaClient,
  type Prisma,
  type DeliveryResolutionEnum,
  type DeliveryStageEnum,
  type DeliveryWorkStatusEnum,
  type ProductCategoryEnum,
  type ProductStatusEnum,
  type ProductTypeEnum,
} from '@nbos/database';
import {
  loadStageChecklistProgressByOwner,
  pickProgressForEntity,
} from '../../checklist-templates/checklist-instance-stage-progress';
import { mergeActiveParentProjectScope } from '../active-project-list-scope';
import { attachProductDeliveryLifecycle } from '../delivery-lifecycle';
import { batchProductOpenCounts } from './batch-product-open-counts';
import { buildProductCurrentStageReadiness } from './product-current-stage-readiness';
import { volumeAdjustedByOwner } from '../../delivery-compensation/volume-adjusted-flags';
import { productBillingCompanyWhere } from './product-billing-company.where';
import {
  applyProductHubAndSearch,
  classifyProductHubViewFromRow,
  shouldClassifyProductHubView,
} from './product-list-where';
import {
  PRODUCT_HUB_LIST_INCLUDE,
  PRODUCT_LIST_INCLUDE,
  splitProductListSubscriptions,
} from './product-list-query';

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  /** Filter by product billing company, falling back to the project default. */
  companyId?: string;
  status?: string;
  deliveryStage?: string;
  deliveryWorkStatus?: string;
  deliveryResolution?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string;
  search?: string;
  hubView?: string;
  includeHubView?: string | boolean;
}

export async function findAllProducts(
  prisma: InstanceType<typeof PrismaClient>,
  params: ProductQueryParams,
) {
  const {
    page = 1,
    pageSize = 20,
    projectId,
    companyId,
    status,
    deliveryStage,
    deliveryWorkStatus,
    deliveryResolution,
    productCategory,
    productType,
    pmId,
    search,
    hubView,
    includeHubView,
  } = params;
  const classifyHubView = shouldClassifyProductHubView(hubView, includeHubView);
  const where: Prisma.ProductWhereInput = {};

  if (projectId) where.projectId = projectId;
  if (companyId) {
    Object.assign(where, productBillingCompanyWhere(companyId));
  }
  if (status) where.status = status as ProductStatusEnum;
  if (deliveryStage) where.deliveryStage = deliveryStage as DeliveryStageEnum;
  if (deliveryWorkStatus) {
    where.deliveryWorkStatus = deliveryWorkStatus as DeliveryWorkStatusEnum;
  }
  if (deliveryResolution) {
    where.deliveryResolution = deliveryResolution as DeliveryResolutionEnum;
  }
  if (productCategory) where.productCategory = productCategory as ProductCategoryEnum;
  if (productType) where.productType = productType as ProductTypeEnum;
  if (pmId) where.pmId = pmId;
  applyProductHubAndSearch(where, hubView, search);

  const scopedWhere = mergeActiveParentProjectScope(where, { projectId });

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: scopedWhere,
      include: classifyHubView ? PRODUCT_HUB_LIST_INCLUDE : PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where: scopedWhere }),
  ]);

  const openByProduct = await batchProductOpenCounts(
    prisma,
    items.map((p) => p.id),
  );

  const lifecycleByProduct = new Map(
    items.map((product) => [product.id, attachProductDeliveryLifecycle(product)]),
  );
  const volumeAdjusted = await volumeAdjustedByOwner(
    prisma,
    'productId',
    items.map((product) => product.id),
  );
  const checklistProgressMap = await loadStageChecklistProgressByOwner(
    prisma,
    items.map((product) => ({
      ownerEntityType: 'PRODUCT' as const,
      ownerEntityId: product.id,
      stage: lifecycleByProduct.get(product.id)?.deliveryLifecycle.stage ?? null,
    })),
  );

  return {
    items: items.map((product) => {
      const withLc = lifecycleByProduct.get(product.id) ?? attachProductDeliveryLifecycle(product);
      const open = openByProduct.get(product.id) ?? {
        openTasks: 0,
        openTickets: 0,
        openExtensions: 0,
      };
      const readiness = buildProductCurrentStageReadiness(product, withLc.deliveryLifecycle, open);
      const checklistStageProgress = pickProgressForEntity(
        checklistProgressMap,
        'PRODUCT',
        product.id,
        withLc.deliveryLifecycle.stage,
      );
      const currentStageReadiness = mergeChecklistIntoReadiness(readiness, checklistStageProgress);
      const { listed, subscriptions: liveSubscriptions } = splitProductListSubscriptions(withLc);
      return {
        ...listed,
        ...(classifyHubView
          ? {
              hubView: classifyProductHubViewFromRow({
                deliveryResolution: product.deliveryResolution,
                status: product.status,
                subscriptions: liveSubscriptions,
              }),
            }
          : {}),
        deliveryLifecycle: {
          ...withLc.deliveryLifecycle,
          ...(currentStageReadiness ? { currentStageReadiness } : {}),
        },
        checklistStageProgress,
        volumeAdjusted: volumeAdjusted.get(product.id) ?? false,
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
