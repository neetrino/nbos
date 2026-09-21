'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { FunctionInstructionSheet } from './function-instruction-sheet';

export function FunctionCatalogDetailSheet({
  item,
  onOpenChange,
}: {
  item: DeliveryFunctionOperationalDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={item !== null} layout="auxiliary" showRailActions={false}>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {item ? <FunctionInstructionSheet item={item} /> : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
