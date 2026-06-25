import { Building2, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  DeliveryLifecycleProjection,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';
import {
  formatDeliveryHoldUntil,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';
import type { DealTypePresentation } from '@/lib/deal-type-visual';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import {
  DELIVERY_BOARD_CARD_DATE_ICON_SIZE,
  DELIVERY_BOARD_CARD_DATE_LABEL_CLASS,
  DELIVERY_BOARD_CARD_DATE_ROW_CLASS,
  DELIVERY_BOARD_CARD_META_ICON_BASE_CLASS,
} from './delivery-board-card-ui.constants';
import { formatDeliveryBoardCardDate } from './format-delivery-board-card-date';
import type { DeliveryBoardItem } from './project-delivery-board-model';
import { cn } from '@/lib/utils';

export type DeliveryBoardCardMetaDensity = 'full' | 'minimal' | 'board';

export function DeliveryCardMeta({
  item,
  metaDensity,
  visual,
}: {
  item: DeliveryBoardItem;
  metaDensity: DeliveryBoardCardMetaDensity;
  visual?: DealTypePresentation;
}) {
  if (metaDensity === 'board') {
    if (!visual) return null;
    return <BoardCardMeta item={item} visual={visual} />;
  }
  if (item.kind === 'PRODUCT') {
    return <ProductCardMeta product={item.product} metaDensity={metaDensity} />;
  }
  return <ExtensionCardMeta extension={item.extension} metaDensity={metaDensity} />;
}

function BoardCardMeta({
  item,
  visual,
}: {
  item: DeliveryBoardItem;
  visual: DealTypePresentation;
}) {
  const chrome = getDeliveryBoardCardChrome(visual);
  if (item.kind === 'PRODUCT') {
    return <ProductBoardMeta product={item.product} metaIconClass={chrome.metaIconClass} />;
  }
  return <ExtensionBoardMeta extension={item.extension} metaIconClass={chrome.metaIconClass} />;
}

function ProductBoardMeta({
  product,
  metaIconClass,
}: {
  product: ProjectProductSummary;
  metaIconClass: string;
}) {
  const holdCopy = getHoldCopy(product.deliveryLifecycle);
  return (
    <div className="space-y-2.5 text-left">
      {product.project ? (
        <BoardMetaLine
          icon={Building2}
          label={`${product.project.name} (${product.project.code})`}
          metaIconClass={metaIconClass}
        />
      ) : null}
      {product.deadline ? (
        <BoardMetaLine
          icon={Calendar}
          label={formatDeliveryBoardCardDate(product.deadline)}
          metaIconClass={metaIconClass}
          labelClassName={DELIVERY_BOARD_CARD_DATE_LABEL_CLASS}
          iconSize={DELIVERY_BOARD_CARD_DATE_ICON_SIZE}
        />
      ) : null}
      {holdCopy ? (
        <p className={getHoldCopyClassName(product.deliveryLifecycle)}>{holdCopy}</p>
      ) : null}
    </div>
  );
}

function ExtensionBoardMeta({
  extension,
  metaIconClass,
}: {
  extension: ProjectExtensionSummary;
  metaIconClass: string;
}) {
  const holdCopy = getHoldCopy(extension.deliveryLifecycle);
  return (
    <div className="space-y-2.5 text-left">
      {extension.project ? (
        <BoardMetaLine
          icon={Building2}
          label={`${extension.project.name} (${extension.project.code})`}
          metaIconClass={metaIconClass}
        />
      ) : null}
      {extension.product ? (
        <BoardMetaLine
          icon={Building2}
          label={extension.product.name}
          metaIconClass={metaIconClass}
        />
      ) : null}
      {holdCopy ? (
        <p className={getHoldCopyClassName(extension.deliveryLifecycle)}>{holdCopy}</p>
      ) : null}
    </div>
  );
}

function ProductCardMeta({
  product,
  metaDensity,
}: {
  product: ProjectProductSummary;
  metaDensity: Exclude<DeliveryBoardCardMetaDensity, 'board'>;
}) {
  const holdCopy = getHoldCopy(product.deliveryLifecycle);
  const minimal = metaDensity === 'minimal';
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {product.project && (
        <LegacyMetaLine
          icon={Building2}
          label={`${product.project.name} (${product.project.code})`}
        />
      )}
      {product.deadline && (
        <LegacyMetaLine
          icon={Calendar}
          label={formatDeliveryBoardCardDate(product.deadline)}
          emphasizeDate
        />
      )}
      {!minimal ? (
        <p className="text-muted-foreground text-xs">
          {product._count.tasks} Work Space tasks · {product._count.extensions} ext. ·{' '}
          {product._count.tickets} tickets
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
  metaDensity: Exclude<DeliveryBoardCardMetaDensity, 'board'>;
}) {
  const holdCopy = getHoldCopy(extension.deliveryLifecycle);
  const minimal = metaDensity === 'minimal';
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {extension.project && (
        <LegacyMetaLine
          icon={Building2}
          label={`${extension.project.name} (${extension.project.code})`}
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

function BoardMetaLine({
  icon: Icon,
  label,
  metaIconClass,
  labelClassName = 'text-foreground min-w-0 truncate text-xs leading-snug',
  iconSize = 14,
}: {
  icon: LucideIcon;
  label: string;
  metaIconClass: string;
  labelClassName?: string;
  iconSize?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn(DELIVERY_BOARD_CARD_META_ICON_BASE_CLASS, metaIconClass)}>
        <Icon size={iconSize} aria-hidden />
      </span>
      <span className={labelClassName}>{label}</span>
    </div>
  );
}

function LegacyMetaLine({
  icon: Icon,
  label,
  emphasizeDate = false,
}: {
  icon: LucideIcon;
  label: string;
  emphasizeDate?: boolean;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-1.5',
        emphasizeDate ? DELIVERY_BOARD_CARD_DATE_ROW_CLASS : 'text-muted-foreground text-xs',
      )}
    >
      <Icon size={emphasizeDate ? DELIVERY_BOARD_CARD_DATE_ICON_SIZE : 12} aria-hidden />
      <span className="truncate">{label}</span>
    </p>
  );
}
