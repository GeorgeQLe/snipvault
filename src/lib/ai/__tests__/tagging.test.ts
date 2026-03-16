import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const taggingSource = readFileSync(
  resolve(__dirname, '../tagging.ts'),
  'utf-8',
);

describe('tagging.ts static analysis', () => {
  it('does not use non-null assertion on found (found!)', () => {
    const matches = taggingSource.match(/found!/g);
    expect(matches).toBeNull();
  });

  it('has a null check before returning found.id', () => {
    const hasNullCheck =
      /if\s*\(\s*!found\s*\)/.test(taggingSource) ||
      /if\s*\(\s*found\s*==\s*null\s*\)/.test(taggingSource);
    expect(hasNullCheck).toBe(true);
  });
});
