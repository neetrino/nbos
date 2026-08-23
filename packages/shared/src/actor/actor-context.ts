import type { ActorChannelSource, ActorType } from './actor-types';

export interface ActorIdentity {
  id: string;
  type: ActorType;
  displayName: string;
}

export interface ActorOnBehalfOf {
  id: string;
  type: ActorType;
}

/**
 * Safe client metadata only. Never include bearer tokens, hashes, or provider keys.
 */
export interface ActorClientMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Credential prefix / key id — never the raw secret. */
  credentialId?: string | null;
}

export interface ActorChannel {
  source: ActorChannelSource;
  protocol?: string | null;
}

/**
 * Normalized actor identity shared by policy, capabilities, audit, and workers.
 * Machine actors must never be represented as fake Employees.
 */
export interface ActorContext {
  actor: ActorIdentity;
  organizationId?: string | null;
  onBehalfOf?: ActorOnBehalfOf | null;
  channel?: ActorChannel | null;
  correlationId?: string | null;
  requestId?: string | null;
  client?: ActorClientMetadata | null;
}

export type ActorContextInput = {
  actor: Partial<ActorIdentity> & Pick<ActorIdentity, 'id' | 'type'>;
  organizationId?: string | null;
  onBehalfOf?: ActorOnBehalfOf | null;
  channel?: ActorChannel | null;
  correlationId?: string | null;
  requestId?: string | null;
  client?: ActorClientMetadata | null;
};
