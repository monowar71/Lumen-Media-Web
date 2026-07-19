import { describe, expect, it } from 'vitest';
import { downloadMediaUrl } from './mediaFile';

describe('downloadMediaUrl', () => {
  it('builds download URL with access token', () => {
    const url = downloadMediaUrl('http://nas:8096', 'abc-123', 'tok');
    expect(url).toBe(
      'http://nas:8096/api/v1/items/abc-123/download?access_token=tok',
    );
  });

  it('includes optional sourceId', () => {
    const url = downloadMediaUrl('http://nas:8096/', 'abc', 'tok', 'src-1');
    expect(url).toContain('sourceId=src-1');
  });
});
