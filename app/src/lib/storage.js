// storage.js — persistence facade. Picks the cloud store when a user is signed
// in (and cloud is configured), otherwise the device-local store. Components
// import only from here, so they never need to know which backend is active.
import { getUserId } from "./authState.js";
import { cloudEnabled } from "./supabase.js";
import * as local from "./localStore.js";
import * as cloud from "./cloudStore.js";

const store = () => (cloudEnabled && getUserId() ? cloud : local);

export const listLetterheads = (...a) => store().listLetterheads(...a);
export const saveLetterhead = (...a) => store().saveLetterhead(...a);
export const deleteLetterhead = (...a) => store().deleteLetterhead(...a);
export const listPresets = (...a) => store().listPresets(...a);
export const savePreset = (...a) => store().savePreset(...a);
export const deletePreset = (...a) => store().deletePreset(...a);

// one-time push of everything in the local store up to the cloud (used after
// first sign-in so existing offline work isn't stranded).
export async function migrateLocalToCloud() {
  if (!(cloudEnabled && getUserId())) return { letterheads: 0, presets: 0 };
  const lhs = await local.listLetterheads();
  for (const lh of lhs) { const { id, ...rest } = lh; await cloud.saveLetterhead(rest); }
  const ps = await local.listPresets();
  for (const p of ps) { const { id, ...rest } = p; await cloud.savePreset(rest); }
  return { letterheads: lhs.length, presets: ps.length };
}
