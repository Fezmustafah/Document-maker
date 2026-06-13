// image.js — downscale an uploaded letterhead before storing.
// Target: <=1100px wide JPEG at ~0.82 quality (PROMPT §4.1). Keeps IndexedDB small.

const MAX_WIDTH = 1100;
const JPEG_QUALITY = 0.82;

/**
 * Read a File/Blob, downscale to <=MAX_WIDTH wide, return a JPEG data URL.
 * @param {File|Blob} file
 * @returns {Promise<string>} data:image/jpeg;base64,...
 */
export function downscaleToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        // white matte so transparent PNGs don't go black when flattened to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Detect the letterhead's brand/accent colour by sampling the image and picking
// the most prominent saturated colour (ignoring paper-white and near-black ink).
// Falls back to the darkest prominent colour (handles grey/navy logos).
export function dominantAccent(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const W = 120;
      const H = Math.max(1, Math.round((img.height / img.width) * W));
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;

      const buckets = new Map(); // quantised colour -> {count, satSum, r,g,b}
      const darkCand = { score: -1, r: 0, g: 0, b: 0 };
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (a < 200) continue;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const v = max / 255;
        const s = max === 0 ? 0 : (max - min) / max;
        if (v > 0.93 || v < 0.1) continue; // skip paper-white & near-black
        // track a dark fallback (deep navy/grey logos)
        if (v < 0.5 && v > 0.12) {
          const score = (0.5 - v) + s;
          if (score > darkCand.score) { darkCand.score = score; darkCand.r = r; darkCand.g = g; darkCand.b = b; }
        }
        if (s < 0.22) continue; // ignore greys for the main vote
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
        const cur = buckets.get(key) || { count: 0, satSum: 0, r: 0, g: 0, b: 0 };
        cur.count++; cur.satSum += s; cur.r += r; cur.g += g; cur.b += b;
        buckets.set(key, cur);
      }

      let best = null, bestScore = 0;
      for (const v of buckets.values()) {
        const score = v.count * (v.satSum / v.count); // frequency x saturation
        if (score > bestScore) { bestScore = score; best = v; }
      }
      const pick = best
        ? { r: best.r / best.count, g: best.g / best.count, b: best.b / best.count }
        : darkCand.score > 0
        ? darkCand
        : null;
      if (!pick) return resolve(null);
      const hex = "#" + [pick.r, pick.g, pick.b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
      resolve(hex);
    };
    img.src = dataUrl;
  });
}

export default downscaleToDataUrl;
