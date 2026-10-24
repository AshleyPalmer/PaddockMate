/**
 * Calculates tyre pressure bleed amount and subsequent adjusted pressure.
 */
export function calculateTyreBleed(
  hotPressure: number,
  targetPressure: number
): {
  bleed: number;
  adjustedPressure: number;
} {
  const bleed = Number((hotPressure - targetPressure).toFixed(2));
  const adjustedPressure = targetPressure;
  return { bleed, adjustedPressure };
}
