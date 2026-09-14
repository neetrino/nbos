/** Stable same-origin img src; `v` busts browser cache after replace. */
export function buildEmployeeAvatarDisplayUrl(employeeId: string, fileAssetId: string): string {
  const version = encodeURIComponent(fileAssetId);
  return `/api/employees/${employeeId}/avatar?v=${version}`;
}
