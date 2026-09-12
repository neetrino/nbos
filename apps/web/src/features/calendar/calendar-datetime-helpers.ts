export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDatetimeLocalValue(d: Date, hour: number, minute: number): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(hour)}:${pad2(minute)}`;
}
