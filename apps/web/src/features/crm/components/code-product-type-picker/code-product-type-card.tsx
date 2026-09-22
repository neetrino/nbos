import { cn } from '@/lib/utils';
import type { CodeProductTypeOption } from './code-product-type-picker.types';

type CodeProductTypeCardProps = {
  option: CodeProductTypeOption;
  selected: boolean;
  onSelect: (value: string) => void;
};

export function CodeProductTypeCard({ option, selected, onSelect }: CodeProductTypeCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(option.value)}
      className={cn(
        'border-border bg-card flex h-full flex-col gap-1 rounded-xl border p-3 text-left',
        'hover:bg-muted/40 transition-colors',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <span className="text-foreground text-sm font-medium">{option.label}</span>
      <span className="text-muted-foreground text-xs leading-snug">{option.description}</span>
    </button>
  );
}
