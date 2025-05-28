const PRIVACY_KEYWORDS = [
  'password', 'ssn', 'social security', 'credit card', 'email',
  'phone', 'address', 'secret', 'dob', 'birthdate', 'bank account',
  'pin', 'security code', 'cvv', 'passport', 'driver license'
];

// AI/ML Inspired Detection: simple keyword matching + fuzzy partial match (case insensitive)
export function detectLeaksAI(text) {
  const textLower = text.toLowerCase();
  const foundLeaks = [];

  for (const keyword of PRIVACY_KEYWORDS) {
    if (textLower.includes(keyword)) {
      foundLeaks.push(keyword);
    }
  }

  // Future: integrate ML model here for semantic detection

  return [...new Set(foundLeaks)];  // remove duplicates
}
