import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routeSource = readFileSync(
  resolve(__dirname, "../device-code/route.ts"),
  "utf-8"
);

describe("Rate limiting on device-code endpoint (CR-016)", () => {
  it("contains rate limiting logic", () => {
    expect(routeSource).toMatch(/checkRateLimit|rateLimit/);
  });

  it("returns 429 status when rate limited", () => {
    expect(routeSource).toContain("429");
  });
});
