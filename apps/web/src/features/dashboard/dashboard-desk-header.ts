export const DASHBOARD_DESK_KICKER = 'Operations desk';
export const DASHBOARD_DESK_FALLBACK_GREETING = 'Ready when you are';
export const DASHBOARD_DESK_SUBLINE =
  'What needs a decision, a follow-up, or a clean handoff today.';

export function deskHeading(firstName?: string): string {
  const name = firstName?.trim();
  return name ? `Welcome back, ${name}` : DASHBOARD_DESK_FALLBACK_GREETING;
}
