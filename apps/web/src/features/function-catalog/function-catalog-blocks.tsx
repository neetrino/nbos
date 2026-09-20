'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { FunctionCatalogCard } from './function-catalog-card';
import {
  catalogFunctionGradations,
  type GradationSelectionState,
} from './function-catalog-gradation';
import {
  FUNCTION_CATALOG_CARD_GRID_CLASS,
  FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS,
  STATUS_LABEL_KEY,
} from './function-catalog.constants';
import type { CatalogCategoryBlock } from './function-catalog-grouping';
import { salePriceCardLabels, type VisibleSalePrice } from './function-catalog-sale-price';
import { isCatalogFunctionSelectable } from './function-catalog-select';
import { visibleUnitsTotal } from './function-catalog-units';

export type FunctionCatalogBrowserMode =
  | { kind: 'browse'; showStatus: boolean; onOpen: (id: string) => void }
  | {
      kind: 'pick';
      selectedIds: ReadonlySet<string>;
      alreadyAddedIds: ReadonlySet<string>;
      onToggle: (id: string) => void;
      gradationByFunctionId: GradationSelectionState;
      onSelectGradation: (functionId: string, tierId: string) => void;
    };

export function FunctionCatalogCategoryBlocks({
  blocks,
  mode,
  unitsByFunctionId,
  salePriceByFunctionId,
  formatUnits,
  formatSalePrice,
}: {
  blocks: CatalogCategoryBlock<DeliveryFunctionOperationalDto>[];
  mode: FunctionCatalogBrowserMode;
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  formatUnits: (total: number) => string;
  formatSalePrice: (amount: string) => string;
}) {
  const t = useTranslations('hr.functionCatalog');
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <section key={block.id} className="space-y-3">
          <CategoryHeading label={t(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS[block.id])} />
          <div className={FUNCTION_CATALOG_CARD_GRID_CLASS}>
            {block.items.map((item) => (
              <FunctionCatalogCard
                key={item.id}
                item={item}
                variant="compact"
                unitsLabel={unitsLabelFor(item.id, unitsByFunctionId, formatUnits)}
                {...salePriceCardLabels(
                  salePriceByFunctionId.get(item.id),
                  formatSalePrice,
                  t('unpublishedPrice'),
                )}
                {...cardModeProps(item, mode, t)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CategoryHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-foreground shrink-0 text-sm font-semibold">{label}</h2>
      <div className="border-border h-px flex-1 border-t" />
    </div>
  );
}

function unitsLabelFor(
  functionId: string,
  unitsByFunctionId: Map<string, number> | undefined,
  formatUnits: (total: number) => string,
): string | undefined {
  const total = visibleUnitsTotal(
    unitsByFunctionId !== undefined,
    unitsByFunctionId?.get(functionId),
  );
  return total === undefined ? undefined : formatUnits(total);
}

function cardModeProps(
  item: DeliveryFunctionOperationalDto,
  mode: FunctionCatalogBrowserMode,
  t: CatalogCopy,
): Pick<
  Parameters<typeof FunctionCatalogCard>[0],
  | 'showStatus'
  | 'statusLabel'
  | 'onOpen'
  | 'onToggle'
  | 'selected'
  | 'selectable'
  | 'alreadyAdded'
  | 'alreadyAddedLabel'
  | 'gradations'
  | 'selectedTierId'
  | 'chooseVolumeLabel'
  | 'onSelectGradation'
> {
  if (mode.kind === 'browse') {
    return {
      showStatus: mode.showStatus,
      statusLabel: statusLabel(item.status, t),
      onOpen: mode.onOpen,
    };
  }
  const alreadyAdded = mode.alreadyAddedIds.has(item.id);
  return {
    selected: mode.selectedIds.has(item.id),
    selectable: isCatalogFunctionSelectable(item, mode.alreadyAddedIds),
    alreadyAdded,
    alreadyAddedLabel: alreadyAdded ? t('alreadyAdded') : undefined,
    onToggle: mode.onToggle,
    gradations: catalogFunctionGradations(item),
    selectedTierId: mode.gradationByFunctionId[item.id],
    chooseVolumeLabel: t('chooseVolume'),
    onSelectGradation: mode.onSelectGradation,
  };
}

function statusLabel(status: string, t: CatalogCopy): string {
  if (status === 'ACTIVE') return t(STATUS_LABEL_KEY.ACTIVE);
  if (status === 'ARCHIVED') return t(STATUS_LABEL_KEY.ARCHIVED);
  return t(STATUS_LABEL_KEY.DRAFT);
}

type CatalogCopy = ReturnType<typeof useTranslations<'hr.functionCatalog'>>;
