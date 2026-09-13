export const ANSI = {
  reset: '\u001b[0m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  cyan: '\u001b[36m',
};

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function colorEnabled(env = process.env) {
  return env.NO_COLOR === undefined || env.NO_COLOR === '';
}

/**
 * @param {boolean} enabled
 * @param {string} color
 * @param {string} text
 * @returns {string}
 */
export function paint(enabled, color, text) {
  return enabled ? `${color}${text}${ANSI.reset}` : text;
}
