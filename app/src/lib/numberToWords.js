// numberToWords.js — UAE Dirham amount to words.
// Format: "<Words> Dirhams[ and <Fils> Fils] Only". Singular "Dirham" for exactly 1.
// Supports up to billions. Fils = 2-decimal sub-unit (rounded).

const ONES = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
  "Eighty", "Ninety",
];
// scale groups, largest first
const SCALES = [
  { value: 1_000_000_000, name: "Billion" },
  { value: 1_000_000, name: "Million" },
  { value: 1_000, name: "Thousand" },
];

// words for 0..999
function threeDigitsToWords(n) {
  const parts = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) {
    if (rest < 20) {
      parts.push(ONES[rest]);
    } else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      parts.push(o > 0 ? `${TENS[t]}-${ONES[o]}` : TENS[t]);
    }
  }
  return parts.join(" ");
}

// words for any non-negative integer
function integerToWords(n) {
  if (n === 0) return "Zero";
  const chunks = [];
  let remaining = n;
  for (const { value, name } of SCALES) {
    if (remaining >= value) {
      const count = Math.floor(remaining / value);
      chunks.push(`${threeDigitsToWords(count)} ${name}`);
      remaining %= value;
    }
  }
  if (remaining > 0) chunks.push(threeDigitsToWords(remaining));
  return chunks.join(" ");
}

/**
 * Convert a number to UAE Dirham words.
 * @param {number} amount
 * @returns {string} e.g. "One Hundred Dirhams and Fifty Fils Only"
 */
export function numberToWords(amount) {
  const safe = Number(amount) || 0;
  const dirhams = Math.floor(Math.abs(safe));
  // round fils to 2 dp to avoid float noise (479587.50 -> 50, not 49)
  const fils = Math.round((Math.abs(safe) - dirhams) * 100);

  const dirhamWord = dirhams === 1 ? "Dirham" : "Dirhams";
  let out = `${integerToWords(dirhams)} ${dirhamWord}`;

  if (fils > 0) {
    out += ` and ${integerToWords(fils)} Fils`;
  }
  out += " Only";
  return out;
}

export default numberToWords;
