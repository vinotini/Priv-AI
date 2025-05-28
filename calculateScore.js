// Risk score based on leak count and density

export function calculateScore(text, leaks) {
  if (leaks.length === 0) return 0;

  const textLength = text.length;
  const leakCount = leaks.length;

  // Density = number of leaks per 1000 characters
  const density = (leakCount / textLength) * 1000;

  // Simple formula: weight density and leak count to calculate risk score max 100%
  const score = Math.min(100, (density * 15) + (leakCount * 5));

  return score;
}
