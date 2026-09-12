export const QUICK_ACTION_LAUNCH_MARK = 'quick_action_launch';
export const QUICK_TASK_FORM_VISIBLE_MARK = 'quick_task_form_visible';
export const QUICK_TASK_TITLE_INTERACTIVE_MARK = 'quick_task_title_interactive';
export const QUICK_TASK_IDENTITY_READY_MARK = 'quick_task_identity_ready';
export const QUICK_TASK_BACKGROUND_READY_MARK = 'quick_task_background_tasks_ready';
export const QUICK_TASK_SUBMIT_START_MARK = 'quick_task_submit_start';
export const QUICK_TASK_SUBMIT_SUCCESS_MARK = 'quick_task_submit_success';
export const QUICK_TASK_SUBMIT_FAILURE_MARK = 'quick_task_submit_failure';

function canMeasure(): boolean {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function';
}

export function markQuickAction(name: string): void {
  if (!canMeasure()) {
    return;
  }
  performance.mark(name);
}

export function measureQuickAction(name: string, startMark: string, endMark: string): void {
  if (!canMeasure() || typeof performance.measure !== 'function') {
    return;
  }
  try {
    performance.measure(name, startMark, endMark);
  } catch {
    // Marks may be missing on a cold first paint; never throw from telemetry.
  }
}
