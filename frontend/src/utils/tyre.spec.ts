import { describe, it, expect } from "vitest";
import { calculateTyreBleed } from "./tyre";

describe("calculateTyreBleed", () => {
  it("calculates positive bleed when tyre hot pressure exceeds target", () => {
    const result = calculateTyreBleed(34.0, 30.0);
    expect(result.bleed).toBe(4.0);
    expect(result.adjustedPressure).toBe(30.0);
  });

  it("calculates zero bleed when hot pressure matches target exactly", () => {
    const result = calculateTyreBleed(30.0, 30.0);
    expect(result.bleed).toBe(0.0);
    expect(result.adjustedPressure).toBe(30.0);
  });

  it("calculates negative bleed (inflation needed) when under target", () => {
    const result = calculateTyreBleed(28.5, 30.0);
    expect(result.bleed).toBe(-1.5);
    expect(result.adjustedPressure).toBe(30.0);
  });
});
