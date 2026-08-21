export const ACTOR_TYPES = [
  'USER',
  'EXTERNAL_AGENT',
  'INTERNAL_AI',
  'SYSTEM',
  'AUTOMATION',
] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];

export const ACTOR_TYPE_DISPLAY_NAME: Record<ActorType, string> = {
  USER: 'Employee',
  EXTERNAL_AGENT: 'External Agent',
  INTERNAL_AI: 'Internal AI',
  SYSTEM: 'System',
  AUTOMATION: 'Automation',
};

export const ACTOR_CHANNELS = [
  'web',
  'rest',
  'mcp',
  'worker',
  'scheduler',
  'system',
  'messenger',
] as const;

export type ActorChannelSource = (typeof ACTOR_CHANNELS)[number];

export const MACHINE_ACTOR_TYPES = [
  'EXTERNAL_AGENT',
  'INTERNAL_AI',
  'SYSTEM',
  'AUTOMATION',
] as const satisfies readonly ActorType[];

export function isActorType(value: string): value is ActorType {
  return (ACTOR_TYPES as readonly string[]).includes(value);
}

export function isActorChannelSource(value: string): value is ActorChannelSource {
  return (ACTOR_CHANNELS as readonly string[]).includes(value);
}

export function isMachineActorType(type: ActorType): boolean {
  return (MACHINE_ACTOR_TYPES as readonly ActorType[]).includes(type);
}

export function isEmployeeActorType(type: ActorType): boolean {
  return type === 'USER';
}
