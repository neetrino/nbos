/** True when click target is a control inside a ticket row/card (avoid opening detail). */
export function isSupportInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest('button,select,a,input,textarea,[role="combobox"]'));
}
