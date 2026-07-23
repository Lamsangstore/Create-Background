/**
 * Turn an arbitrary product name into a safe file name fragment.
 * Keeps Latin letters/digits, Thai characters, underscore and hyphen; everything
 * else collapses to a single underscore. Falls back to "product" when empty.
 */
export function sanitizeFileName(s: string): string {
  return (
    s
      .replace(/[^a-zA-Z0-9_฀-๿-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'product'
  );
}
