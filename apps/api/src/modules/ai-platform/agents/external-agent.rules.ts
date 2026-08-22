import { BadRequestException } from '@nestjs/common';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../ai-platform.constants';

export function requireAgentName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException('name is required');
  }
  if (trimmed.length > AGENT_NAME_MAX_LENGTH) {
    throw new BadRequestException(`name exceeds ${AGENT_NAME_MAX_LENGTH} characters`);
  }
  return trimmed;
}

/** `undefined` means "leave unchanged"; an empty string clears the field. */
export function normalizeAgentDescription(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed.length > AGENT_DESCRIPTION_MAX_LENGTH) {
    throw new BadRequestException(`description exceeds ${AGENT_DESCRIPTION_MAX_LENGTH} characters`);
  }
  return trimmed.length > 0 ? trimmed : null;
}
