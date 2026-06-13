// mapConfig.js — turn form state into a buildPDF config. Keeps pdf.js pure.
import { computeTotals } from "./pdf.js";
import { numberToWords } from "./numberToWords.js";

export function stateToConfig(s) {
  const { total } = computeTotals(s.items, s.vatPercent);
  return {
    docType: s.docType,
    letterheadDataUrl: s.letterheadDataUrl,
    accent: s.accent,
    margins: s.margins,
    title: s.title,
    subTitle: s.subTitle,
    refLabel: s.refLabel,
    refNumber: s.refNumber,
    date: s.date,
    party: s.party,
    currency: s.currency === "none" ? "" : s.currency,
    items: s.items,
    vatPercent: s.vatPercent,
    showAmountInWords: s.showAmountInWords,
    amountInWords: numberToWords(total),
    intro: s.intro,
    validity: s.validity,
    bank: {
      heading: s.bank.heading,
      lines: (s.bank.linesText || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    },
    closingNote: s.closingNote,
    signature: s.signature,
    // letter mode
    subject: s.subject,
    salutation: s.salutation,
    body: s.body,
    closingLine: s.closingLine,
    // statement (ledger) mode
    fromBlock: s.fromBlock,
    opening: s.opening,
    ledger: s.ledger,
  };
}
