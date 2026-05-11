import { Building2, Calendar, User } from 'lucide-react';
import type {
  DeliveryLifecycleProjection,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';
import {
  formatDeliveryHoldUntil,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';
import type { DeliveryBoardItem } from './project-delivery-board-model';

export type DeliveryBoardCardMetaDensity = 'full' | 'minimal';

export function DeliveryCardMeta({
  item,
  metaDensity,
}: {
  item: DeliveryBoardItem;
  metaDensity: DeliveryBoardCardMetaDensity;
}) {
  if (item.kind === 'PRODUCT') {
    return <ProductCardMeta product={item.product} metaDensity={metaDensity} />;
  }
  return <ExtensionCardMeta extension={item.extension} metaDensity={metaDensity} />;
}

function ProductCardMeta({
  product,
  metaDensity,
}: {
  product: ProjectProductSummary;
  metaDensity: DeliveryBoardCardMetaDensity;
}) {
  const holdCopy = getHoldCopy(product.deliveryLifecycle);
  const minimal = metaDensity === 'minimal';
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {product.project && (
        <MetaLine icon={Building2} label={`${product.project.name} (${product.project.code})`} />
      )}
      {!minimal && product.pm && (
        <MetaLine icon={User} label={`${product.pm.firstName} ${product.pm.lastName}`} />
      )}
      {product.deadline && (
        <MetaLine icon={Calendar} label={new Date(product.deadline).toLocaleDateString()} />
      )}
      {!minimal ? (
        <p className="text-muted-foreground text-xs">
          {product._count.tasks} Work Space tasks · {product._count.extensions} ext. ·{' '}
          {product._count.tickets} tickets
        </p>
      ) : null}
      {product.checklistStageProgress && product.checklistStageProgress.total > 0 ? (
        <p className="text-muted-foreground text-xs">
          Checklist {product.checklistStageProgress.completed}/
          {product.checklistStageProgress.total}
        </p>
      ) : null}
      {holdCopy && <p className={getHoldCopyClassName(product.deliveryLifecycle)}>{holdCopy}</p>}
    </div>
  );
}

function ExtensionCardMeta({
  extension,
  metaDensity,
}: {
  extension: ProjectExtensionSummary;
  metaDensity: DeliveryBoardCardMetaDensity;
}) {
  const holdCopy = getHoldCopy(extension.deliveryLifecycle);
  const minimal = metaDensity === 'minimal';
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {extension.project && (
        <MetaLine
          icon={Building2}
          label={`${extension.project.name} (${extension.project.code})`}
        />
      )}
      {!minimal && extension.assignee && (
        <MetaLine
          icon={User}
          label={`${extension.assignee.firstName} ${extension.assignee.lastName}`}
        />
      )}
      {!minimal ? (
        <p className="text-muted-foreground text-xs">
          {extension.product?.name ?? 'No linked product'} · {extension._count.tasks} Work Space
          tasks
        </p>
      ) : extension.product ? (
        <p className="text-muted-foreground truncate text-xs">{extension.product.name}</p>
      ) : (
        <p className="text-muted-foreground text-xs">No linked product</p>
      )}
      {extension.checklistStageProgress && extension.checklistStageProgress.total > 0 ? (
        <p className="text-muted-foreground text-xs">
          Checklist {extension.checklistStageProgress.completed}/
          {extension.checklistStageProgress.total}
        </p>
      ) : null}
      {holdCopy && <p className={getHoldCopyClassName(extension.deliveryLifecycle)}>{holdCopy}</p>}
    </div>
  );
}

function getHoldCopy(lifecycle: DeliveryLifecycleProjection | undefined) {
  if (lifecycle?.workStatus !== 'ON_HOLD') return null;
  const date = formatDeliveryHoldUntil(lifecycle.onHoldUntil);
  if (isDeliveryHoldExpired(lifecycle)) return date ? `Hold expired on ${date}` : 'Hold expired';
  return date ? `On hold until ${date}` : 'On hold';
}

function getHoldCopyClassName(lifecycle: DeliveryLifecycleProjection | undefined) {
  const base = 'text-xs font-medium';
  return lifecycle && isDeliveryHoldExpired(lifecycle)
    ? `${base} text-amber-600`
    : `${base} text-muted-foreground`;
}

function MetaLine({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Icon size={12} />
      <span className="truncate">{label}</span>
    </p>
  );
}
