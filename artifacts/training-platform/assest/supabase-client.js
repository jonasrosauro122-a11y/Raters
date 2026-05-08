// =========================================================
// SUPABASE CLIENT — Frontend proxy layer
// All writes go through Netlify Functions, never directly
// from the browser with sensitive keys.
// =========================================================

const NETLIFY_SUBMIT      = '/.netlify/functions/submit-attempt';
const NETLIFY_GET         = '/.netlify/functions/get-attempts';
const NETLIFY_LEADERBOARD = '/.netlify/functions/get-leaderboard';

// ─── Submit Exam Attempt (via Netlify Function) ────────────
export async function submitAttempt(attempt) {
  try {
    const res = await fetch(NETLIFY_SUBMIT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(attempt),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('[Supabase] submit error:', res.status, text);
      return { success: false, error: `Server returned ${res.status}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    // Graceful degradation — localStorage still holds the record
    console.warn('[Supabase] network error (offline?), attempt saved locally:', err.message);
    return { success: false, error: err.message, offline: true };
  }
}

// ─── Fetch Attempts for Admin (via Netlify Function) ──────
export async function fetchAttempts(filters = {}, adminToken = '') {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('_token', adminToken);

    const res = await fetch(`${NETLIFY_GET}?${params.toString()}`);

    if (res.status === 401) return { success: false, error: 'Unauthorized', code: 401 };
    if (!res.ok) return { success: false, error: `Server ${res.status}` };

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, offline: true };
  }
}

// ─── Fetch Leaderboard (via Netlify Function) ─────────────
export async function fetchLeaderboard(adminToken = '') {
  try {
    const params = new URLSearchParams({ _token: adminToken });
    const res = await fetch(`${NETLIFY_LEADERBOARD}?${params.toString()}`);

    if (res.status === 401) return { success: false, error: 'Unauthorized', code: 401 };
    if (!res.ok) return { success: false, error: `Server ${res.status}` };

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, offline: true };
  }
}

// ─── Health check ─────────────────────────────────────────
export async function checkSupabaseConnection() {
  try {
    const res = await fetch(NETLIFY_GET + '?_health=1', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
