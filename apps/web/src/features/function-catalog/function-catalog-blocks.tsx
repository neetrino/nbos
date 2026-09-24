'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { BrowseFunctionCard } from './browse-function-card';
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
      includedIds?: ReadonlySet<string>;
      onToggle: (id: string) => void;
      gradationByFunctionId: GradationSelectionState;
      onSelectGradation: (functionId: string, tierId: string) => void;
    };

export function FunctionCatalogCategoryBlocks({
  blocks,
  mode,
  unitsByFunctionId,
  salePriceByFunctionId,
  cardGridClassName,
  formatUnits,
  formatSalePrice,
}: {
  blocks: CatalogCategoryBlock<DeliveryFunctionOperationalDto>[];
  mode: FunctionCatalogBrowserMode;
  unitsByFunctionId: Map<string, number> | undefined;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
  cardGridClassName?: string;
  formatUnits: (total: number) => string;
  formatSalePrice: (amount: string) => string;
}) {
  const t = useTranslations('hr.functionCatalog');
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <section key={block.id} className="space-y-3">
          <CategoryHeading label={t(FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS[block.id])} />
          <div className={cardGridClassName ?? FUNCTION_CATALOG_CARD_GRID_CLASS}>
            {block.items.map((item) => (
              <CatalogBlockCard
                key={item.id}
                item={item}
                mode={mode}
                unitsLabel={
                  includedInBase(mode, item.id)
                    ? undefined
                    : unitsLabelFor(item.id, unitsByFunctionId, formatUnits)
                }
                saleLabels={
                  includedInBase(mode, item.id)
                    ? {}
                    : salePriceCardLabels(
                        salePriceByFunctionId.get(item.id),
                        formatSalePrice,
                        t('unpublishedPrice'),
                      )
                }
                t={t}
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

function includedInBase(mode: FunctionCatalogBrowserMode, functionId: string): boolean {
  return mode.kind === 'pick' && mode.includedIds?.has(functionId) === true;
}

function includedLabel(
  included: boolean,
  alreadyAdded: boolean,
  selected: boolean,
  t: CatalogCopy,
): string | undefined {
  if (included) return t('inBase');
  if (!alreadyAdded) return undefined;
  return selected ? t('selected') : t('alreadyAdded');
}

function CatalogBlockCard({
  item,
  mode,
  unitsLabel,
  saleLabels,
  t,
}: {
  item: DeliveryFunctionOperationalDto;
  mode: FunctionCatalogBrowserMode;
  unitsLabel?: string;
  saleLabels: { salePriceLabel?: string; unpublishedLabel?: string };
  t: CatalogCopy;
}) {
  if (mode.kind === 'browse') {
    return (
      <BrowseFunctionCard
        item={item}
        unitsLabel={unitsLabel}
        salePriceLabel={saleLabels.salePriceLabel}
        showStatus={mode.showStatus}
        statusLabel={statusLabel(item.status, t)}
        onOpen={mode.onOpen}
      />
    );
  }
  return (
    <FunctionCatalogCard
      item={item}
      variant="compact"
      unitsLabel={unitsLabel}
      {...saleLabels}
      {...cardModeProps(item, mode, t)}
    />
  );
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
  const included = mode.includedIds?.has(item.id) === true;
  const alreadyAdded = included || mode.alreadyAddedIds.has(item.id);
  const selected = mode.selectedIds.has(item.id);
  return {
    selected,
    selectable: isCatalogFunctionSelectable(item, mode.alreadyAddedIds) && !included,
    alreadyAdded,
    alreadyAddedLabel: includedLabel(included, alreadyAdded, selected, t),
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
