export const MAIL_COMPOSE_FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
] as const;

export type MailComposeFontSize = (typeof MAIL_COMPOSE_FONT_SIZES)[number];

export const MAIL_COMPOSE_FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
] as const;

export const MAIL_COMPOSE_TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Black', value: '#111827' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#7c3aed' },
] as const;

export const MAIL_COMPOSE_HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Light blue', value: '#bfdbfe' },
  { label: 'Light green', value: '#bbf7d0' },
  { label: 'Light red', value: '#fecaca' },
  { label: 'Light gray', value: '#e5e7eb' },
] as const;

export const MAIL_COMPOSE_TABLE_GRID_MAX = 10;

export const MAIL_COMPOSE_TABLE_STYLE =
  'border-collapse: collapse; width: 100%; border: 1px solid #d0d5dd;';

export const MAIL_COMPOSE_TABLE_CELL_STYLE =
  'border: 1px solid #d0d5dd; padding: 6px 8px; vertical-align: top;';

export const MAIL_COMPOSE_TABLE_HEADER_STYLE =
  'border: 1px solid #d0d5dd; padding: 6px 8px; vertical-align: top; background-color: #f9fafb;';
