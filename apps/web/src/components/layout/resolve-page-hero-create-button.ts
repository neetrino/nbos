const SETTINGS_HINT = /settings/i;
const CREATE_HINT = /\b(create|new|add)\b/i;

function controlLabel(button: HTMLButtonElement): string {
  return `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`.trim();
}

function isSettingsControl(button: HTMLButtonElement): boolean {
  return SETTINGS_HINT.test(controlLabel(button));
}

function isCreateControl(button: HTMLButtonElement): boolean {
  if (button.dataset.mobileDockCreate === 'true') return true;
  return CREATE_HINT.test(controlLabel(button));
}

/** Finds the PageHero trailing primary (New / Create) for the mobile dock New slot. */
export function resolvePageHeroCreateButton(root: ParentNode): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll('button')).filter(
    (element): element is HTMLButtonElement => element instanceof HTMLButtonElement,
  );
  const marked = buttons.find((button) => button.dataset.mobileDockCreate === 'true');
  if (marked) return marked;
  return buttons.find((button) => isCreateControl(button) && !isSettingsControl(button)) ?? null;
}
