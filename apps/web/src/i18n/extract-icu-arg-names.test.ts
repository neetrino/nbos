import { describe, expect, it } from 'vitest';
import { extractIcuArgNames } from './extract-icu-arg-names';

describe('extractIcuArgNames', () => {
  it('reads simple interpolation names', () => {
    expect(extractIcuArgNames('Released {released} · Paid {paid}')).toEqual(['paid', 'released']);
  });

  it('reads the argument of a plural message and ignores inner copy', () => {
    expect(extractIcuArgNames('{count, plural, one {# file} other {# files}}')).toEqual(['count']);
  });

  it('ignores translated identifier names that are not ICU args', () => {
    expect(extractIcuArgNames('Աշխատավարձ (թողարկում)՝ {ամիս}')).toEqual([]);
  });
});
