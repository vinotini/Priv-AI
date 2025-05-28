export function calculateRiskScore(text, leaks) {
  const baseScore = 10;
  const leakPenalty = leaks.length * 30;
  const lengthFactor = Math.min(text.length / 1000, 60);

  let totalScore = baseScore + leakPenalty + lengthFactor;
  if (totalScore > 100) totalScore = 100;

  return Math.round(totalScore * 100) / 100;
}
