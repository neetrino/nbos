export type AtsCallbackCallKind = 'accepted' | 'rejected' | 'unknown' | 'unconfigured';

export interface AtsCallbackCallInput {
  from: string;
  to: string;
}

export interface AtsCallbackCallResult {
  kind: AtsCallbackCallKind;
}
