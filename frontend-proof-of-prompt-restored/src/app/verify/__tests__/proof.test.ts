import { hashContent } from '@/utils/proof';

describe('hashContent', () => {
  it('generates deterministic hashes', () => {
    const hash1 = hashContent('Hello', 'World');
    const hash2 = hashContent('  hello  ', 'WORLD');
    expect(hash1).toEqual(hash2);
  });

  it('generates different hashes for different content', () => {
    const hash1 = hashContent('Hello', 'World');
    const hash2 = hashContent('Hello!', 'World');
    expect(hash1).not.toEqual(hash2);
  });
});