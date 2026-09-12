import type { PinnedAction, PinnedActionKind } from './dashboard-control-registry';

export function isPinnedCreateAction(
  action: PinnedAction,
): action is Extract<PinnedAction, { kind: 'create' }> {
  return action.kind === 'create';
}

export function isPinnedOpenAction(
  action: PinnedAction,
): action is Extract<PinnedAction, { kind: 'open' }> {
  return action.kind === 'open';
}

export function partitionPinnedActionsByKind(actions: readonly PinnedAction[]): {
  create: PinnedAction[];
  open: PinnedAction[];
} {
  const create: PinnedAction[] = [];
  const open: PinnedAction[] = [];
  for (const action of actions) {
    if (action.kind === 'create') create.push(action);
    else open.push(action);
  }
  return { create, open };
}

export function pinnedActionKindLabel(kind: PinnedActionKind): string {
  return kind === 'create' ? 'Create' : 'Open';
}
