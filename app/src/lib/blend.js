// blend.js — turn a photographed signature/stamp (usually dark/colored ink on a
// white page) into transparent PNGs that sit naturally on a letterhead.
// Produces 3 variants so the user picks the cleanest one before adding.

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Could not decode image."));
    i.src = src;
  });
}

const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const copy = (img) => new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);

// 1) Natural blend — alpha follows ink darkness. White vanishes, ink stays, edges
//    feather softly. Best for pen signatures; looks "blended" on any background.
function inkAlpha(src) {
  const out = copy(src);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = lumOf(d[i], d[i + 1], d[i + 2]);
    let a = 255 - l; // dark ink -> opaque, white -> transparent
    if (l > 245) a = 0;
    // slightly deepen the ink so faded scans still read
    const k = 0.85;
    d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
    d[i + 3] = Math.max(0, Math.min(255, a));
  }
  return out;
}

// 2) Clean cutout — hard-ish threshold. Keeps original colour, removes the page.
//    Best for solid stamps and crisp black signatures.
function cleanCutout(src) {
  const out = copy(src);
  const d = out.data;
  const hi = 205, lo = 165; // ramp band
  for (let i = 0; i < d.length; i += 4) {
    const l = lumOf(d[i], d[i + 1], d[i + 2]);
    let a;
    if (l >= hi) a = 0;
    else if (l <= lo) a = 255;
    else a = Math.round((1 - (l - lo) / (hi - lo)) * 255);
    d[i + 3] = a;
  }
  return out;
}

// 3) Bold stamp — removes white and boosts contrast + saturation of what remains,
//    so a faint blue/red stamp pops. Best for weak or low-ink stamps.
function boldStamp(src) {
  const out = copy(src);
  const d = out.data;
  const cut = 220;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const l = lumOf(r, g, b);
    const a = l >= cut ? 0 : Math.round((1 - l / cut) * 255);
    // contrast boost around mid
    const boost = (v) => Math.max(0, Math.min(255, (v - 128) * 1.35 + 128));
    // saturation boost
    const avg = (r + g + b) / 3;
    r = boost(avg + (r - avg) * 1.4);
    g = boost(avg + (g - avg) * 1.4);
    b = boost(avg + (b - avg) * 1.4);
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  }
  return out;
}

const VARIANTS = [
  { key: "ink", label: "Natural blend", fn: inkAlpha },
  { key: "cutout", label: "Clean cutout", fn: cleanCutout },
  { key: "bold", label: "Bold stamp", fn: boldStamp },
];

/**
 * @param {string} dataUrl source image (any format)
 * @returns {Promise<{aspect:number, variants:{key,label,dataUrl}[]}>}
 */
export async function blendVariants(dataUrl) {
  const img = await loadImage(dataUrl);
  const maxW = 700;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const base = document.createElement("canvas");
  base.width = w;
  base.height = h;
  const bctx = base.getContext("2d", { willReadFrequently: true });
  bctx.drawImage(img, 0, 0, w, h);
  const src = bctx.getImageData(0, 0, w, h);

  const variants = VARIANTS.map(({ key, label, fn }) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").putImageData(fn(src), 0, 0);
    return { key, label, dataUrl: c.toDataURL("image/png") };
  });

  return { aspect: h / w, variants };
}

export default blendVariants;
