import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const searchSourcePath = resolve(__dirname, '../search.ts');
const searchSource = readFileSync(searchSourcePath, 'utf-8');

describe('search router SQL injection prevention', () => {
  it('does not use sql.unsafe()', () => {
    const unsafeMatches = searchSource.match(/sql\.unsafe\(/g);
    expect(unsafeMatches).toBeNull();
  });

  it('does not interpolate user input directly into SQL strings', () => {
    // Check for patterns like `'${variable}'` which indicate unparameterized string interpolation
    // Exclude the vectorStr construction (safe: numeric join of embedding floats)
    const lines = searchSource.split('\n');
    const dangerousLines = lines.filter((line) => {
      // Skip the vectorStr construction line — it's a numeric array join, not user input
      if (line.includes('queryEmbedding.join')) return false;
      // Flag any '${...}' pattern in SQL context (single-quoted interpolation)
      return /'\$\{[^}]+\}'/.test(line);
    });
    expect(dangerousLines).toEqual([]);
  });

  it('uses parameterized queries with numbered placeholders', () => {
    // The refactored code should use $1, $2, etc. placeholders
    expect(searchSource).toContain('params.push(');
    expect(searchSource).toContain('conditions.push(');
    // Should use sql() callable form, not sql`` tagged template for search queries
    expect(searchSource).toContain('await sql(');
  });

  it('exports searchRouter', async () => {
    try {
      const mod = await import('../search');
      expect(mod.searchRouter).toBeDefined();
    } catch (e: unknown) {
      // Module may fail to load without env vars (e.g., OPENAI_API_KEY).
      // Verify it's an expected env error, not a syntax/import issue.
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toMatch(/credentials|API_KEY|environment/i);
    }
  });
});
