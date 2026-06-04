import { serializeEnvBundle, type EnvBundleEntry } from '@nbos/shared';

/** Triggers browser download of a `.env` file from bundle entries. */
export function downloadEnvBundleFile(
  entries: EnvBundleEntry[],
  filename = 'credentials.env',
): void {
  const body = serializeEnvBundle(entries);
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
