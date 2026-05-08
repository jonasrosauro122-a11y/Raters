// =========================================================
// NETLIFY FUNCTION: get-leaderboard
// Returns top scores per trainee per track/exam combination.
// Auth-gated — same token as get-attempts.
// =========================================================

export const config = { path: '/api/get-leaderboard' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_TOKEN  = process.env.ADMIN_TOKEN || 'trainer2024';
const TABLE        = 'exam_attempts';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default async function handler(req) {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const url    = new URL(req.url);
  const params = url.searchParams;

  // Auth gate
  const token = params.get('_token') || req.headers.get('x-admin-token') || '';
  if (token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  // No Supabase configured — return empty (UI falls back to localStorage)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(
      JSON.stringify({ success: true, rows: [], reason: 'Supabase not configured' }),
      { status: 200, headers }
    );
  }

  // Fetch all relevant columns, ordered by score desc, limit 1000
  const query = [
    'select=trainee_name,trainee_id_badge,track_id,track_title,exam_id,exam_title,exam_type,percentage,passed,submitted_at',
    'order=percentage.desc,submitted_at.asc',
    'limit=1000',
  ].join('&');

  try {
    const supaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?${query}`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      console.error('[get-leaderboard] Supabase error:', supaRes.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Supabase ${supaRes.status}` }),
        { status: 502, headers }
      );
    }

    const rawRows = await supaRes.json();

    // Deduplicate: keep only best score per trainee+track+examType
    const bestMap = {};
    rawRows.forEach((r) => {
      const key = `${r.trainee_name}|${r.track_id}|${r.exam_type}`;
      if (!bestMap[key] || r.percentage > bestMap[key].percentage) {
        bestMap[key] = r;
      }
    });

    const rows = Object.values(bestMap).map((r) => ({
      traineeName:    r.trainee_name,
      traineeIdBadge: r.trainee_id_badge,
      trackId:        r.track_id,
      trackTitle:     r.track_title,
      examId:         r.exam_id,
      examTitle:      r.exam_title,
      examType:       r.exam_type,
      percentage:     r.percentage,
      passed:         r.passed,
      submittedAt:    r.submitted_at,
    }));

    return new Response(
      JSON.stringify({ success: true, rows }),
      { status: 200, headers }
    );

  } catch (err) {
    console.error('[get-leaderboard] Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers }
    );
  }
}
