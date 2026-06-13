// cloudStore.js — Supabase-backed persistence. Same interface as localStore.
// Tables: letterheads, layouts. user_id defaults to auth.uid() server-side and
// Row Level Security restricts every row to its owner.
import { supabase } from "./supabase.js";

const lhFromRow = (r) => ({
  id: r.id, name: r.name, dataUrl: r.data_url,
  marginTop: r.margin_top, marginBottom: r.margin_bottom, marginSide: r.margin_side, accent: r.accent,
});
const lhToRow = (lh) => ({
  name: lh.name, data_url: lh.dataUrl,
  margin_top: lh.marginTop, margin_bottom: lh.marginBottom, margin_side: lh.marginSide, accent: lh.accent,
});

export async function listLetterheads() {
  const { data, error } = await supabase.from("letterheads").select("*").order("name");
  if (error) throw error;
  return (data || []).map(lhFromRow);
}

export async function saveLetterhead(lh) {
  const row = lhToRow(lh);
  const q = lh.id
    ? supabase.from("letterheads").update(row).eq("id", lh.id).select().single()
    : supabase.from("letterheads").insert(row).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return lhFromRow(data);
}

export async function deleteLetterhead(id) {
  const { error } = await supabase.from("letterheads").delete().eq("id", id);
  if (error) throw error;
}

const presetFromRow = (r) => ({ id: r.id, _name: r.name, _kind: "editor", elements: r.elements, meta: r.meta });

export async function listPresets() {
  const { data, error } = await supabase.from("layouts").select("*").order("name");
  if (error) throw error;
  return (data || []).map(presetFromRow);
}

export async function savePreset(preset) {
  const row = { name: preset._name, elements: preset.elements, meta: preset.meta };
  const { data, error } = await supabase.from("layouts").insert(row).select().single();
  if (error) throw error;
  return presetFromRow(data);
}

export async function deletePreset(id) {
  const { error } = await supabase.from("layouts").delete().eq("id", id);
  if (error) throw error;
}
