export interface OneTimeSecretHostState {
  loading: boolean;
  createOpen: boolean;
  secret: string | null;
  createdAgentId: string | null;
}

export type OneTimeSecretHostAction =
  | { type: 'OPEN_CREATE' }
  | { type: 'CREATE_WITH_TOKEN'; agentId: string; token: string }
  | { type: 'ISSUE_WITH_TOKEN'; token: string }
  | { type: 'ROTATE_WITH_TOKEN'; token: string }
  | { type: 'PARENT_REFRESH_START' }
  | { type: 'CANCEL_CREATE' }
  | { type: 'CLOSE_SECRET' };

export function initialSecretHostState(): OneTimeSecretHostState {
  return { loading: false, createOpen: false, secret: null, createdAgentId: null };
}

export function reduceSecretHost(
  state: OneTimeSecretHostState,
  action: OneTimeSecretHostAction,
): OneTimeSecretHostState {
  if (action.type === 'OPEN_CREATE') {
    return { ...state, createOpen: true };
  }
  if (action.type === 'CREATE_WITH_TOKEN') {
    return {
      ...state,
      createdAgentId: action.agentId,
      secret: action.token,
      loading: false,
    };
  }
  if (action.type === 'ISSUE_WITH_TOKEN' || action.type === 'ROTATE_WITH_TOKEN') {
    return { ...state, secret: action.token, loading: false };
  }
  if (action.type === 'PARENT_REFRESH_START') {
    if (state.secret !== null || state.createOpen) {
      return { ...state, loading: true };
    }
    return { ...state, loading: true, createOpen: false };
  }
  if (action.type === 'CANCEL_CREATE') {
    if (state.secret !== null) {
      return state;
    }
    return { ...state, createOpen: false };
  }
  return {
    ...state,
    secret: null,
    createOpen: false,
    createdAgentId: null,
    loading: false,
  };
}

export function isSecretVisible(state: OneTimeSecretHostState): boolean {
  return state.secret !== null;
}

export function isCreateHostMounted(state: OneTimeSecretHostState): boolean {
  return state.createOpen || state.secret !== null;
}
