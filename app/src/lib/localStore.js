// localStore.js — device-local persistence via idb-keyval (the offline / no-login
// store). Same interface as cloudStore so the facade can swap freely.
import { get, set, del, keys } from "idb-keyval";

const LH_PREFIX = "lh:";
const PRESET_PREFIX = "preset:";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function listLetterheads() {
  const allKeys = await keys();
  const lhKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(LH_PREFIX));
  const items = await Promise.all(lhKeys.map((k) => get(k)));
  return items.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveLetterhead(lh) {
  const record = { ...lh, id: lh.id || uid() };
  await set(LH_PREFIX + record.id, record);
  return record;
}

export async function deleteLetterhead(id) {
  await del(LH_PREFIX + id);
}

export async function listPresets() {
  const allKeys = await keys();
  const pKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(PRESET_PREFIX));
  const items = await Promise.all(pKeys.map((k) => get(k)));
  return items.filter(Boolean).sort((a, b) => (a._name || "").localeCompare(b._name || ""));
}

export async function savePreset(preset) {
  const record = { ...preset, id: preset.id || uid() };
  await set(PRESET_PREFIX + record.id, record);
  return record;
}

export async function deletePreset(id) {
  await del(PRESET_PREFIX + id);
}
