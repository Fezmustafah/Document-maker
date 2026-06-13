// quota.js — talks to the SECURITY DEFINER RPC. Single source of truth for AI
// usage. consumeAiCredit returns the remaining quota AFTER decrement, or null
// when blocked (out of credits, not signed in, or cloud disabled).
import { supabase, cloudEnabled } from "./supabase.js";

export async function getQuota() {
  if (!cloudEnabled) return null;
  const { data, error } = await supabase
    .from("user_quota")
    .select("free_left, used")
    .single();
  if (error) return null;
  return data;
}

export async function consumeAiCredit() {
  if (!cloudEnabled) return null;
  const { data, error } = await supabase.rpc("consume_ai_credit");
  if (error || !data || !data.length) return null;
  return data[0]; // { free_left, used }
}
