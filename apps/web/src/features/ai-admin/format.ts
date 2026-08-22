export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return 'Never';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString();
}

export function employeeLabel(
  employees: Array<{ id: string; firstName: string; lastName: string }>,
  employeeId: string,
): string {
  const match = employees.find((item) => item.id === employeeId);
  return match ? `${match.firstName} ${match.lastName}`.trim() : employeeId.slice(0, 8);
}
