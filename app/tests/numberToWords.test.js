import { describe, it, expect } from "vitest";
import { numberToWords } from "../src/lib/numberToWords.js";

describe("numberToWords (UAE Dirhams)", () => {
  const cases = [
    [429000, "Four Hundred Twenty-Nine Thousand Dirhams Only"],
    [20000, "Twenty Thousand Dirhams Only"],
    [
      479587.5,
      "Four Hundred Seventy-Nine Thousand Five Hundred Eighty-Seven Dirhams and Fifty Fils Only",
    ],
    [1, "One Dirham Only"],
    [2776, "Two Thousand Seven Hundred Seventy-Six Dirhams Only"],
    [14950, "Fourteen Thousand Nine Hundred Fifty Dirhams Only"],
  ];

  it.each(cases)("%d -> %s", (input, expected) => {
    expect(numberToWords(input)).toBe(expected);
  });

  it("handles zero", () => {
    expect(numberToWords(0)).toBe("Zero Dirhams Only");
  });

  it("handles billions", () => {
    expect(numberToWords(1_000_000_000)).toBe("One Billion Dirhams Only");
  });
});
