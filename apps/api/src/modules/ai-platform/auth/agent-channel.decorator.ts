import { SetMetadata } from '@nestjs/common';
import type { ActorChannelSource } from '@nbos/shared';

export const AGENT_CHANNEL_METADATA = 'nbos:agent-channel';

/**
 * Declares the protocol a route serves.
 *
 * Provenance recorded in ActorContext and Audit must be a server-side fact. A
 * client cannot be allowed to label its own REST call as MCP (or the reverse),
 * so the channel comes from route metadata and never from a request header.
 */
export const AgentChannel = (channel: ActorChannelSource) =>
  SetMetadata(AGENT_CHANNEL_METADATA, channel);
