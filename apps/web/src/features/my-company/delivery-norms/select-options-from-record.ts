export function selectOptionsFromRecord<T extends string>(
  values: readonly T[],
  labels: Record<string, string>,
): Array<{ value: T; label: string }> {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

export function applySelectValue<T extends string>(
  values: readonly T[],
  value: string,
  apply: (next: T) => void,
): void {
  const next = values.find((item) => item === value);
  if (next === undefined) {
    return;
  }
  apply(next);
}
