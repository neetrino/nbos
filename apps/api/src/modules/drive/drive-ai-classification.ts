import type { FileConfidentialityEnum } from '@nbos/database';
import type { AiDataClassification } from '@nbos/shared';

/**
 * Drive confidentiality → shared AI ladder (`INTERNAL` / `SENSITIVE` / `SECRET`).
 *
 * `SECRET_ADJACENT` is not a step on that ladder: it is blocked for agents
 * before policy, with the same external error as a missing file.
 */
export const DRIVE_CONFIDENTIALITY_FORBIDDEN_TO_AGENTS = 'SECRET_ADJACENT' as const;

const TO_AI_LADDER: Record<FileConfidentialityEnum, AiDataClassification> = {
  PUBLIC_INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'INTERNAL',
  FINANCE_SENSITIVE: 'SENSITIVE',
  LEGAL_SENSITIVE: 'SENSITIVE',
  SECRET_ADJACENT: 'SECRET',
};

export function isDriveConfidentialityForbiddenToAgents(
  confidentiality: string,
): confidentiality is typeof DRIVE_CONFIDENTIALITY_FORBIDDEN_TO_AGENTS {
  return confidentiality === DRIVE_CONFIDENTIALITY_FORBIDDEN_TO_AGENTS;
}

/**
 * Maps a Drive confidentiality value onto the AI ladder.
 * Callers must treat `SECRET_ADJACENT` as forbidden before using the result
 * as `targetDataClassification` for an agent.
 */
export function mapDriveConfidentialityToAi(
  confidentiality: FileConfidentialityEnum | string,
): AiDataClassification {
  if (confidentiality in TO_AI_LADDER) {
    return TO_AI_LADDER[confidentiality as FileConfidentialityEnum];
  }
  return 'SECRET';
}
