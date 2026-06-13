// brandKits.js — neutral starter presets. No real company data ships in the app.
// Users enter their own details per document (kept on their device / account).

export const BRAND_KITS = [
  {
    id: "navy",
    name: "Navy / corporate",
    accent: "#1A2456",
    defaults: { docType: "tax-invoice", mt: 52, mb: 26, ms: 24 },
  },
  {
    id: "blue",
    name: "Blue / services",
    accent: "#1F4E8C",
    defaults: { docType: "quotation", mt: 48, mb: 24, ms: 22 },
  },
  {
    id: "slate",
    name: "Slate / minimal",
    accent: "#33475B",
    defaults: { docType: "letter", mt: 50, mb: 24, ms: 24 },
  },
];

// Apply a starter preset: just accent + margins + doc type. No personal data.
export function brandKitToPartial(kit) {
  return {
    accent: kit.accent,
    margins: { top: kit.defaults.mt, bottom: kit.defaults.mb, side: kit.defaults.ms },
    docType: kit.defaults.docType,
  };
}

export default BRAND_KITS;
