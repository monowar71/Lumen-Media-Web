import { downloadMediaUrl, sanitizeDownloadFileName } from './mediaFile';

describe('downloadMediaUrl', () => {
  it('builds download URL with access token', () => {
    const url = downloadMediaUrl('http://nas:8096', 'abc-123', 'tok');
    expect(url).toBe(
      'http://nas:8096/api/v1/items/abc-123/download?access_token=tok',
    );
  });

  it('includes sourceId when provided', () => {
    const url = downloadMediaUrl('http://nas:8096/', 'abc', 'tok', 'src-1');
    expect(url).toContain('sourceId=src-1');
  });
});

describe('sanitizeDownloadFileName', () => {
  it('strips path separators and reserved characters', () => {
    expect(sanitizeDownloadFileName('a/b:c?.mkv')).toBe('a_b_c_.mkv');
    expect(sanitizeDownloadFileName('   ')).toBe('video');
  });
});
