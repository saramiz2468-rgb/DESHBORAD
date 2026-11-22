import { describe, expect, it } from 'vitest';
import { isAdminPreviewEnabled } from './preview';

describe('isAdminPreviewEnabled', () => {
  it('is locked unless explicitly "true"', () => {
    expect(isAdminPreviewEnabled(undefined)).toBe(false);
    expect(isAdminPreviewEnabled('')).toBe(false);
    expect(isAdminPreviewEnabled('1')).toBe(false);
    expect(isAdminPreviewEnabled('TRUE')).toBe(false);
    expect(isAdminPreviewEnabled('true')).toBe(true);
  });
});
