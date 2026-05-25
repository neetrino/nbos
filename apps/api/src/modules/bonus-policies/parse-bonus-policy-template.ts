import { BadRequestException } from '@nestjs/common';

import {
  BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
  BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
  BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
  BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
  BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
} from './bonus-policy-templates';

export const BONUS_POLICY_TEMPLATE_CODES = [
  BONUS_POLICY_TEMPLATE_SALES_COMPANY_RATES,
  BONUS_POLICY_TEMPLATE_MANUAL_ONLY,
  BONUS_POLICY_TEMPLATE_DELIVERY_PROPORTIONAL_FUNDING,
  BONUS_POLICY_TEMPLATE_MARKETING_MANUAL_PLANNED,
  BONUS_POLICY_TEMPLATE_SUPPORT_MANUAL_PLANNED,
] as const;

export type BonusPolicyTemplateCode = (typeof BONUS_POLICY_TEMPLATE_CODES)[number];

export function parseBonusPolicyTemplateCode(raw: string): BonusPolicyTemplateCode {
  const trimmed = raw.trim();
  if (!BONUS_POLICY_TEMPLATE_CODES.includes(trimmed as BonusPolicyTemplateCode)) {
    throw new BadRequestException(
      `templateCode must be one of: ${BONUS_POLICY_TEMPLATE_CODES.join(', ')}`,
    );
  }
  return trimmed as BonusPolicyTemplateCode;
}
