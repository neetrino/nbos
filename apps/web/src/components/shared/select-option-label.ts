export interface SelectLabelOption {
  value: string;
  label: string;
}

/** Human-readable label for a select value (option label, else title-case from enum code). */
export function resolveSelectOptionLabel(
  value: string,
  options?: readonly SelectLabelOption[],
): string {
  const match = options?.find((opt) => opt.value === value);
  if (match?.label) return match.label;
  return formatEnumCodeLabel(value);
}

export function formatEnumCodeLabel(code: string): string {
  return code
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
