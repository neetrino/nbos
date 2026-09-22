'use client';

import { useMemo, useState } from 'react';
import type {
  DeliveryFunctionOperationalDto,
  DeliveryFunctionPriceFinancialDto,
} from '@nbos/shared';
import { FunctionPriceCreateSheet } from './function-price-create-sheet';
import { FunctionUnitsBrowser } from './function-units-browser';
import { liveFunctionPrices } from './live-function-prices';

type FunctionPricesSectionProps = {
  rows: DeliveryFunctionPriceFinancialDto[];
  catalog: DeliveryFunctionOperationalDto[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
};

export function FunctionPricesSection({
  rows,
  catalog,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: FunctionPricesSectionProps) {
  const pairs = useMemo(() => liveFunctionPrices(rows), [rows]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const focus = catalog.find((item) => item.id === focusId) ?? null;
  return (
    <>
      <FunctionUnitsBrowser
        catalog={catalog}
        pairs={pairs}
        canAdd={canAdd}
        canPublish={canPublish}
        onOpen={setFocusId}
        onChanged={onChanged}
        onError={onError}
      />
      {canAdd || canPublish ? (
        <FunctionPriceCreateSheet
          open={focus !== null}
          catalog={catalog}
          focusFunctionId={focus?.id ?? null}
          focusTitle={focus?.title}
          pairs={pairs}
          onOpenChange={(next) => {
            if (!next) setFocusId(null);
          }}
          onCreated={onChanged}
          onError={onError}
        />
      ) : null}
    </>
  );
}
