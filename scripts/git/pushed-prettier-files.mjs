export const ZERO_GIT_SHA = '0'.repeat(40);
export const FORMAT_FILE_PATTERN = /\.(?:[cm]?[jt]sx?|json|md|css)$/;

/**
 * Git pre-push stdin: `local_ref local_sha remote_ref remote_sha`.
 * `fromSha` is the remote tip; `toSha` is the local tip being pushed.
 */
export function parsePushRanges(stdinText) {
  const ranges = [];
  for (const line of stdinText.split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const localSha = parts[1];
    const remoteSha = parts[3];
    if (!localSha || !remoteSha) continue;
    ranges.push({ fromSha: remoteSha, toSha: localSha });
  }
  return ranges;
}

export function selectFormatFiles(paths) {
  return paths.filter((file) => FORMAT_FILE_PATTERN.test(file));
}

export function isDeletedRemoteRef(toSha) {
  return toSha === ZERO_GIT_SHA;
}
