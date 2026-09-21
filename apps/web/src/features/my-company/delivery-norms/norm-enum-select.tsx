'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function NormEnumSelect<T extends string>({
  id,
  value,
  options,
  labels,
  disabled,
  onChange,
}: {
  id: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (!next || !(options as readonly string[]).includes(next)) {
          return;
        }
        onChange(next as T);
      }}
    >
      <SelectTrigger id={id}>
        <SelectValue>{() => labels[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
