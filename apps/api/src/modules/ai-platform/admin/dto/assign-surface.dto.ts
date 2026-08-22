import { INTERNAL_AI_AGENT_SURFACES } from '@nbos/shared';
import { IsBoolean, IsIn } from 'class-validator';

export class AssignInternalAgentSurfaceDto {
  @IsIn(INTERNAL_AI_AGENT_SURFACES)
  surface!: (typeof INTERNAL_AI_AGENT_SURFACES)[number];

  @IsBoolean()
  enabled!: boolean;
}
