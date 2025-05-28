// A simple AI-enhanced leak detection by keyword & pattern matching

const keywords = [
  "password",
  "ssn",
  "social security number",
  "credit card",
  "card number",
  "address",
  "phone",
  "email",
  "dob",
  "date of birth",
  "bank account",
  "routing number",
  "passport",
  "driver's license",
  "cvv",
];

const regexPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
  /\b(?:\d[ -]*?){13,16}\b/g, // Credit card numbers
  /\b\d{2}\/\d{2}\/\d{4}\b/g, // Date formats like MM/DD/YYYY
  /\b\d{3}\b/g, // Simplified CVV
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
];

export function detectLeaksAI(text) {
  const leaksFound = new Set();

  const lowerText = text.toLowerCase();

  keywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      leaksFound.add(`Keyword found: "${keyword}"`);
    }
  });

  regexPatterns.forEach((regex) => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach((match) => leaksFound.add(`Pattern found: "${match}"`));
    }
  });

  return Array.from(leaksFound);
}
