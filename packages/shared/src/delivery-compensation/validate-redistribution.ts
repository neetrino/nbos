import { DELIVERY_SHARE_PERCENT_TOTAL } from './constants';

export type RedistributionPairInput = {
  outgoingPercent: string;
  incomingPercent: string;
};

export type RedistributionValidationError = 'REDISTRIBUTION_REQUIRED' | 'SHARE_PERCENT_TOTAL';

export function parseRequiredSharePercent(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > DELIVERY_SHARE_PERCENT_TOTAL) {
    return null;
  }
  return value;
}

export function validateRedistributionPair(
  pair: RedistributionPairInput,
): RedistributionValidationError | null {
  const outgoing = parseRequiredSharePercent(pair.outgoingPercent);
  const incoming = parseRequiredSharePercent(pair.incomingPercent);
  if (outgoing === null || incoming === null) {
    return 'REDISTRIBUTION_REQUIRED';
  }
  if (outgoing + incoming !== DELIVERY_SHARE_PERCENT_TOTAL) {
    return 'SHARE_PERCENT_TOTAL';
  }
  return null;
}
