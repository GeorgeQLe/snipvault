import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const snippetSource = readFileSync(
  resolve(__dirname, '../snippet.ts'),
  'utf-8',
);

describe('snippet.ts static analysis', () => {
  it('does not use generic Error for not-found cases', () => {
    const matches = snippetSource.match(/new Error\(['"]Snippet not found['"]\)/g);
    expect(matches).toBeNull();
  });

  it('imports TRPCError from @trpc/server', () => {
    expect(snippetSource).toMatch(/import\s*\{[^}]*TRPCError[^}]*\}\s*from\s*['"]@trpc\/server['"]/);
  });

  it('includes snippet ID in fire-and-forget catch blocks', () => {
    // Find all catch blocks with console.error for background AI tasks
    const catchBlocks = snippetSource.match(/\.catch\(\(err\)\s*=>\s*\{[\s\S]*?\}\)/g) ?? [];
    expect(catchBlocks.length).toBeGreaterThan(0);
    for (const block of catchBlocks) {
      if (block.includes('Background AI')) {
        expect(block).toMatch(/snippet\.id|existing\.id/);
      }
    }
  });
});
