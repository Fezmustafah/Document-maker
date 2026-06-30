// constants.js — default seller / buyer / item data + theme colours for the
// Daily Invoice Tracker. Self-contained: nothing here is shared with the
// letterhead document generator.

export const DEFAULT_SELLER = {
  name: "Bait Al Madina Traditional Kitchen",
  nameAr: "مطبخ بيت المدينة الشعبي",
  address: "Jebel Ali - 1, Dubai, U.A.E",
  phone: "+971 55 692 5963 / +971 54 448 6615",
  email: "adnankhanbhutta786@gmail.com",
  trn: "104213822000003",
};

export const DEFAULT_BUYER = {
  name: "D S C A Building Contracting L.L.C",
  // Registered billing address from the tax notice — fixed, shown on every invoice.
  address: "Prime Commercial Holdings A 304,\nAl Barsha South Fourth, Dubai, U.A.E",
  phone: "+971 58 999 7842",
  trn: "104168815900003",
};

export const DEFAULT_ITEM = {
  description: "Chicken Biryani (Parcel)",
  unitPrice: 10,
};

export const DEFAULT_VAT_RATE = 5;

export const DEFAULT_SETTINGS = {
  seller: { ...DEFAULT_SELLER },
  // saved buyer companies; `buyerId` marks the active one and `buyer` mirrors it
  // (kept denormalised so the PDFs can keep reading settings.buyer unchanged).
  buyers: [{ id: "default", ...DEFAULT_BUYER }],
  buyerId: "default",
  buyer: { ...DEFAULT_BUYER },
  // multiple sellable items; each delivery picks one. VAT is a single global rate.
  items: [{ ...DEFAULT_ITEM }],
  vatRate: DEFAULT_VAT_RATE,
  // header style: built-in drawn header (default) OR one of the user's saved
  // letterheads rendered as the page background.
  header: { style: "drawn", letterheadId: null }, // "drawn" | "letterhead"
  // document look: "classic" = navy/gold/cream colourful theme (default),
  // "corporate" = minimal monochrome, serif display font, hairline rules.
  theme: "classic", // "classic" | "corporate"
};

// Exact RGB values mirrored from the Tailwind tracker tokens (see tailwind.config.js).
export const COLORS = {
  navy:      { r: 27,  g: 42,  b: 91  }, // #1B2A5B — headers, text, boxes
  gold:      { r: 200, g: 169, b: 81  }, // #C8A951 — accents, lines, bars
  cream:     { r: 250, g: 248, b: 243 }, // #FAF8F3 — box fills, alt rows
  creamDark: { r: 224, g: 221, b: 213 }, // #E0DDD5 — borders
  white:     { r: 255, g: 255, b: 255 },
  text:      { r: 34,  g: 34,  b: 34  }, // #222222
  muted:     { r: 102, g: 102, b: 102 }, // #666666
  red:       { r: 192, g: 57,  b: 43  }, // #C0392B — delete buttons
};

// ---- PDF themes ----------------------------------------------------------
// Each theme is a palette (`c`) + font choices (`font`). Both keep the original
// filled-bar contrast (so they read crisply on a letterhead); they differ in
// palette + display font:
//   classic   — fixed navy/gold/cream Bait Al Madina brand.
//   corporate — premium palette that ADAPTS to the selected letterhead: the
//               heading/bar colour is pulled from the letterhead's own brand
//               colour (so it blends with the page) and paired with a champagne
//               gold accent + serif headings. No letterhead -> a deep slate.
const WHITE = { r: 255, g: 255, b: 255 };
const RED = { r: 192, g: 57, b: 43 };
const CHAMPAGNE = { r: 176, g: 145, b: 90 }; // #B0915A — premium gold accent

// --- small colour helpers (no deps) ---
function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const i = parseInt(n || "2a3550", 16);
  return { r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 };
}
const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
function mix(a, b, t) {
  return { r: clamp(a.r + (b.r - a.r) * t), g: clamp(a.g + (b.g - a.g) * t), b: clamp(a.b + (b.b - a.b) * t) };
}
function luma(c) {
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}
// Darken a colour until it's deep enough for white text to read on it, while
// preserving its hue — so a pale brand colour still gives a usable bar.
function ensureDeep(c, max = 0.42) {
  const L = luma(c);
  if (L <= max || L === 0) return c;
  const k = max / L;
  return { r: clamp(c.r * k), g: clamp(c.g * k), b: clamp(c.b * k) };
}

// Build the corporate theme around a letterhead's brand colour (hex) — or a
// premium slate default when no letterhead is in play.
export function corporateTheme(brandHex) {
  const brand = ensureDeep(hexToRgb(brandHex || "#2A3550"));
  return {
    key: "corporate",
    minimal: false,
    c: {
      primary: brand, // bars, headings, table header fill — matched to letterhead
      accent: CHAMPAGNE, // champagne underlines / edges
      panel: mix(brand, WHITE, 0.94), // faint brand tint for box bodies / zebra
      panelEdge: mix(brand, WHITE, 0.74), // soft brand-tinted borders
      white: WHITE,
      text: { r: 31, g: 31, b: 36 },
      muted: { r: 107, g: 107, b: 115 },
      red: RED,
    },
    // Serif display reads premium/editorial; body stays Helvetica for figures.
    font: { display: "times", body: "helvetica" },
  };
}

export const THEMES = {
  classic: {
    key: "classic",
    minimal: false,
    c: {
      primary: COLORS.navy, // bars, headings, table header fill
      accent: COLORS.gold, // rules, edges, underlines
      panel: COLORS.cream, // box fills, alt rows
      panelEdge: COLORS.creamDark, // box borders
      white: WHITE,
      text: COLORS.text,
      muted: COLORS.muted,
      red: RED,
    },
    font: { display: "helvetica", body: "helvetica" },
  },
  // static fallback (used if resolved without a letterhead context)
  corporate: corporateTheme(null),
};

export function getTheme(name) {
  return THEMES[name] || THEMES.classic;
}

// Resolve the theme to draw with, given settings + the letterhead in use.
// Corporate adapts its brand colour to that letterhead; classic is fixed.
export function resolveTheme(settings, letterhead) {
  if (settings && settings.theme === "corporate") {
    return corporateTheme(letterhead && letterhead.accent ? letterhead.accent : null);
  }
  return THEMES.classic;
}

// One full tracking period = 7 days (deliver daily, settle weekly).
export const PERIOD_DAYS = 7;
