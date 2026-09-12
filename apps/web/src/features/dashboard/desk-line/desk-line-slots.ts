import type { DeskLineSlots } from './desk-line.types';

const NAME_TOKEN = '{{firstName}}';
const YEARS_TOKEN = '{{years}}';

export function fillDeskLineSlots(template: string, slots: DeskLineSlots): string {
  const withYears = fillYears(template, slots.years);
  const filled = slots.firstName
    ? withYears.replaceAll(NAME_TOKEN, slots.firstName)
    : dropNameToken(withYears);
  return collapseSpaces(filled);
}

function fillYears(template: string, years?: number): string {
  if (years == null) return template.replaceAll(YEARS_TOKEN, '');
  return template.replaceAll(YEARS_TOKEN, String(years));
}

function dropNameToken(template: string): string {
  const stripped = template
    .replaceAll(`${NAME_TOKEN}, `, '')
    .replaceAll(`, ${NAME_TOKEN}.`, '.')
    .replaceAll(`, ${NAME_TOKEN}`, '')
    .replaceAll(` ${NAME_TOKEN}`, '')
    .replaceAll(NAME_TOKEN, '');
  const cleaned = collapseSpaces(stripped);
  if (!cleaned) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}
