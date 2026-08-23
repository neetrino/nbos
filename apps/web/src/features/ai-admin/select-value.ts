export function applySelectValue(value: string | null, onChange: (next: string) => void): void {
  if (value) {
    onChange(value);
  }
}
