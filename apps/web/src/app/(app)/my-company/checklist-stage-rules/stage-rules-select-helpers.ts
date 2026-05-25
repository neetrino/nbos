export function selectOptionLabel(
  value: string | null,
  options: readonly { value: string; label: string }[],
  anyToken: string,
): string | null {
  if (!value) return null;
  if (value === anyToken) return 'Any';
  return options.find((o) => o.value === value)?.label ?? value;
}
