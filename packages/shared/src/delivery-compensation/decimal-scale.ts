import { DELIVERY_MONEY_SCALE, DELIVERY_UNITS_SCALE } from './constants';

export class DeliveryDecimalError extends Error {
  readonly code = 'DELIVERY_DECIMAL_INVALID';
  constructor(message: string) {
    super(message);
    this.name = 'DeliveryDecimalError';
  }
}

export type ScaledDecimal = {
  value: bigint;
  scale: number;
};

const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

export function parseScaledDecimal(raw: string, scale: number): ScaledDecimal {
  const text = raw.trim();
  if (!DECIMAL_PATTERN.test(text)) {
    throw new DeliveryDecimalError('Invalid decimal');
  }
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [wholePart, fractionPart = ''] = unsigned.split('.');
  const padded = (fractionPart + '0'.repeat(scale)).slice(0, scale);
  const extra = fractionPart.slice(scale);
  const base = BigInt(wholePart + padded);
  if (extra.split('').some((digit) => digit !== '0')) {
    throw new DeliveryDecimalError('Decimal exceeds configured scale');
  }
  return { value: negative ? -base : base, scale };
}

export function quantizeScaled(input: ScaledDecimal, targetScale: number): ScaledDecimal {
  if (input.scale === targetScale) {
    return input;
  }
  if (input.scale < targetScale) {
    return {
      value: input.value * 10n ** BigInt(targetScale - input.scale),
      scale: targetScale,
    };
  }
  const factor = 10n ** BigInt(input.scale - targetScale);
  const remainder = input.value % factor;
  const truncated = input.value / factor;
  const absRemainder = remainder < 0n ? -remainder : remainder;
  const shouldRoundUp = absRemainder * 2n >= factor;
  const delta = shouldRoundUp ? (input.value < 0n ? -1n : 1n) : 0n;
  return { value: truncated + delta, scale: targetScale };
}

export function multiplyScaled(left: ScaledDecimal, right: ScaledDecimal): ScaledDecimal {
  return { value: left.value * right.value, scale: left.scale + right.scale };
}

export function addScaled(left: ScaledDecimal, right: ScaledDecimal): ScaledDecimal {
  const scale = Math.max(left.scale, right.scale);
  const a = quantizeScaled(left, scale);
  const b = quantizeScaled(right, scale);
  return { value: a.value + b.value, scale };
}

export function scaledToString(input: ScaledDecimal): string {
  const negative = input.value < 0n;
  const digits = (negative ? -input.value : input.value).toString().padStart(input.scale + 1, '0');
  const whole = digits.slice(0, digits.length - input.scale) || '0';
  const fraction = digits.slice(digits.length - input.scale);
  const sign = negative ? '-' : '';
  return input.scale === 0 ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
}

export function parseUnits(raw: string): ScaledDecimal {
  return parseScaledDecimal(raw, DELIVERY_UNITS_SCALE);
}

export function parseRate(raw: string): ScaledDecimal {
  return parseScaledDecimal(raw, DELIVERY_UNITS_SCALE);
}

export function unitsTimesRate(units: string, rate: string): string {
  const product = multiplyScaled(parseUnits(units), parseRate(rate));
  return scaledToString(quantizeScaled(product, DELIVERY_MONEY_SCALE));
}

export function sumMoney(amounts: readonly string[]): string {
  const total = amounts.reduce(
    (acc, amount) => addScaled(acc, parseScaledDecimal(amount, DELIVERY_MONEY_SCALE)),
    parseScaledDecimal('0', DELIVERY_MONEY_SCALE),
  );
  return scaledToString(total);
}
