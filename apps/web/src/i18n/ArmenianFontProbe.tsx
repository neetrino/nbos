import { ARMENIAN_FONT_PROBE_SAMPLE, ARMENIAN_FONT_PROBE_TEST_ID } from './armenian-font-probe';

/** Screen-reader-hidden HY glyph probe. Does not enable Armenian as a locale. */
export function ArmenianFontProbe() {
  return (
    <span
      lang="hy"
      data-testid={ARMENIAN_FONT_PROBE_TEST_ID}
      className="sr-only"
      aria-hidden="true"
    >
      {ARMENIAN_FONT_PROBE_SAMPLE}
    </span>
  );
}
