import { cn } from '@/lib/utils';
import type { CatalogFunctionGradation } from './function-catalog-gradation';

export function FunctionCatalogGradationChips({
  functionId,
  gradations,
  selectedTierId,
  groupLabel,
  onSelect,
}: {
  functionId: string;
  gradations: readonly CatalogFunctionGradation[];
  selectedTierId: string | undefined;
  groupLabel: string;
  onSelect: (functionId: string, tierId: string) => void;
}) {
  if (gradations.length === 0) return null;
  return (
    <div role="radiogroup" aria-label={groupLabel} className="flex flex-wrap gap-1 pt-1">
      {gradations.map((gradation) => (
        <GradationChip
          key={gradation.id}
          label={gradation.label}
          selected={selectedTierId === gradation.id}
          onSelect={() => onSelect(functionId, gradation.id)}
        />
      ))}
    </div>
  );
}

function GradationChip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        'rounded-md border px-2 py-0.5 text-xs',
        selected
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border text-muted-foreground hover:bg-muted/40',
      )}
    >
      {label}
    </button>
  );
}
