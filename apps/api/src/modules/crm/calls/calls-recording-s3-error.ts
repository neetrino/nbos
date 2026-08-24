export function isS3RangeNotSatisfiable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const aws = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };
  if (aws.$metadata?.httpStatusCode === 416) return true;
  const code = aws.name ?? aws.Code;
  return code === 'InvalidRange' || code === 'InvalidRangeException';
}
