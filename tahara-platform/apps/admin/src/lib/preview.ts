/** Stage 1: the admin skeleton is reachable only when explicitly enabled (local/preview). */
export function isAdminPreviewEnabled(
  value: string | undefined = process.env.ADMIN_PREVIEW_ENABLED,
): boolean {
  return value === 'true';
}
