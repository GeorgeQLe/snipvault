import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const sourcePath = resolve(__dirname, "../embeddings.ts");
const source = readFileSync(sourcePath, "utf-8");

// ---------------------------------------------------------------------------
// CR-008: Concurrency limiter for OpenAI embeddings
// ---------------------------------------------------------------------------

describe("CR-008: embeddings concurrency control", () => {
  it("imports or uses p-limit / pLimit", () => {
    expect(source).toMatch(/pLimit|p-limit/);
  });

  it("creates a concurrency limiter instance", () => {
    // Should have something like: const embeddingLimit = pLimit(5)
    expect(source).toMatch(/pLimit\(\d+\)/);
  });

  it("wraps generateEmbeddingVector in the concurrency limiter", () => {
    // The function body should use the limiter
    const fnMatch = source.match(
      /async function generateEmbeddingVector[\s\S]*?^}/m
    );
    expect(fnMatch).not.toBeNull();
    const fnBody = fnMatch![0];
    expect(fnBody).toMatch(/embeddingLimit|pLimit/);
  });
});
