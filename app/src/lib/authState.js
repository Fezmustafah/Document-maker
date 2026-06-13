// authState.js — tiny module holding the current signed-in user id, so the
// storage facade can choose cloud vs local without importing React. The
// AuthProvider keeps this in sync with Supabase's session.
let _userId = null;
export const setUserId = (id) => { _userId = id || null; };
export const getUserId = () => _userId;
