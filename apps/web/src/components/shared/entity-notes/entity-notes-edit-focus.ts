/** Ignore TipTap blur from `setEditable` / footer unmount right after Edit. */
export const NOTES_EDIT_ACTIVATE_GUARD_MS = 150;

function isDomNode(value: EventTarget | null | undefined): value is Node {
  return typeof Node !== 'undefined' && value instanceof Node;
}

export function shouldCloseNotesEditorAfterBlur(input: {
  activating: boolean;
  shell: HTMLElement | null;
  activeElement: Element | null;
  relatedTarget?: EventTarget | null;
}): boolean {
  if (input.activating) return false;
  if (input.shell == null) return false;
  if (isDomNode(input.relatedTarget) && input.shell.contains(input.relatedTarget)) {
    return false;
  }
  if (input.activeElement == null) return false;
  return !input.shell.contains(input.activeElement);
}
