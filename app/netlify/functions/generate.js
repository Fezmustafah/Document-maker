// generate.js — Netlify Function. Takes a plain-language brief + doc type and
// returns professionally-worded document content as structured blocks.
// The AI key lives ONLY here (server-side env var), never in the browser bundle.
//
// Free provider: Google Gemini (AI Studio free tier). Set GEMINI_API_KEY in the
// Netlify site's environment variables.

// Primary model (env-overridable) plus fallbacks. On transient 429/503 we retry,
// then drop to a lighter model so a demand spike never breaks the feature.
const MODELS = [
  ...(process.env.GEMINI_MODEL || "gemini-2.5-flash").split(",").map((s) => s.trim()),
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
].filter((m, i, a) => m && a.indexOf(m) === i);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const DOC_LABEL = {
  "tax-invoice": "Tax Invoice",
  invoice: "Invoice",
  quotation: "Quotation",
  proforma: "Proforma Invoice",
  statement: "Statement of Account",
  letter: "Letter / official correspondence",
};

function buildPrompt(brief, docType, company) {
  const label = DOC_LABEL[docType] || "business document";
  return `You are an experienced corporate document writer for a UAE company.
Write the BODY CONTENT for a ${label} that will be printed on the company's EXISTING
printed letterhead. The letterhead already shows the company logo, name, address,
phone, email and footer — so DO NOT repeat any header, logo, address block, or footer.
Only produce the content that goes in the middle of the page.

Company (for tone/signature only): ${company || "the company"}.

Brief from the user (may be rough/typo'd — interpret intent):
"""${brief}"""

Write clean, professional, human wording. Concise. Use AED for currency. Use realistic
UAE business phrasing. If the brief implies amounts or items, lay them out as readable
lines. If it's a letter, write proper paragraphs. Do not invent sensitive data (TRN,
bank, license) unless given in the brief.

Return ONLY JSON in exactly this shape:
{
  "title": "DOCUMENT TITLE IN CAPS or empty string",
  "blocks": [
    { "kind": "ref|date|recipient|subheading|paragraph|bullet|signoff|signature_name|signature_title", "text": "..." },
    { "kind": "table", "columns": [{"label":"Description","align":"left"},{"label":"Qty","align":"right"},{"label":"Unit Price","align":"right"},{"label":"Amount","align":"right"}], "rows": [["...","1","10.00","10.00"]] }
  ]
}
Rules:
- "ref" e.g. "Ref: Q-2026-001" (make a sensible number if not given).
- "date" e.g. "Date: <today or given>".
- "recipient" the addressee block (multi-line ok using \\n).
- "subheading" optional one-line subject/summary.
- "paragraph" normal text; multiple allowed.
- "bullet" one item per block (no dash, just the text).
- "table" for ANY pricing, line items, or breakdown (invoices, quotations, salary breakdowns). Use a "table" block with "columns" (each {label, align}) and "rows" (array of string arrays). Right-align numeric/amount columns. Put a final TOTAL row inside the rows. Pre-format numbers with thousands separators and 2 decimals. Do NOT also repeat the table as bullets or paragraphs.
- "signoff" closing like "Yours sincerely," or "We look forward to your confirmation.".
- "signature_name" the signer's name; "signature_title" their role.
For an invoice/quotation: include a "table" with the line items + totals. For a salary certificate: a "table" with the salary breakdown. For a plain letter: no table.
Order blocks top-to-bottom as they should appear. Keep it tight and well-spaced.`;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "POST only" }) };

  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "AI is not configured yet (missing GEMINI_API_KEY)." }) };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Bad request body." }) };
  }
  const { brief = "", docType = "letter", company = "" } = body;
  if (!brief.trim())
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Describe what to write first." }) };

  const payload = {
    contents: [{ parts: [{ text: buildPrompt(brief, docType, company) }] }],
    generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
  };

  // try each model; retry transient 429/503 once before moving on
  async function callGemini() {
    let lastErr = "No model responded.";
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return res;
        const t = await res.text();
        lastErr = t.slice(0, 300);
        if (res.status === 429 || res.status === 503) {
          await sleep(700);
          continue; // retry, then fall through to next model
        }
        break; // hard error (e.g. bad key / not found) -> next model
      }
    }
    return { ok: false, _err: lastErr };
  }

  try {
    const res = await callGemini();
    if (!res.ok) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "AI is busy right now — try again in a moment.", detail: res._err }) };
    }
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // strip code fences if the model added them
      const cleaned = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }
    if (!parsed || !Array.isArray(parsed.blocks))
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "AI returned an unexpected shape." }) };

    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Request failed.", detail: String(e).slice(0, 200) }) };
  }
};
