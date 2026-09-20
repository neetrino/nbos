import { ISO_CALENDAR_DATE_LENGTH } from './delivery-norms.constants';

const DATE_PART_PAD = 2;

export function todayDateInputValue(now = new Date()): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(DATE_PART_PAD, '0');
  const day = String(now.getDate()).padStart(DATE_PART_PAD, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToIso(dateInput: string): string {
  const trimmed = dateInput.trim();
  if (trimmed.length !== ISO_CALENDAR_DATE_LENGTH) {
    return '';
  }
  return `${trimmed}T00:00:00.000Z`;
}

export function isValidDateInput(dateInput: string): boolean {
  const iso = dateInputToIso(dateInput);
  return iso.length > 0 && !Number.isNaN(Date.parse(iso));
}
