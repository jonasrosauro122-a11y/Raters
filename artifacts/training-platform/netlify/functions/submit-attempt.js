// =========================================================
// NETLIFY FUNCTION: submit-attempt
// Receives exam attempt data and writes to Supabase.
// =========================================================

export const config = { path: '/api/submit-attempt' };

const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY;
const TABLE          = 'exam_attempts';

const ALLOWED_ORIGINS = [
  'https://va-training-portal.netlify.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  // Validate payload
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
  }

  const { traineeName, examId, trackId, percentage, passed, submittedAt } = body;
  if (!traineeName || !examId || !trackId) {
    return new Response(JSON.stringify({ error: 'Missing required fields: traineeName, examId, trackId' }), { status: 422, headers });
  }

  // If Supabase is not configured, return success (graceful degradation)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[submit-attempt] Supabase not configured — attempt accepted locally only.');
    return new Response(JSON.stringify({ success: true, stored: false, reason: 'Supabase not configured' }), { status: 200, headers });
  }

  // Write to Supabase
  try {
    const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        'apikey':         SUPABASE_KEY,
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'Content-Type':   'application/json',
        'Prefer':         'return=representation',
      },
      body: JSON.stringify({
        trainee_name:     traineeName,
        trainee_id_badge: body.traineeIdBadge || null,
        proctor_name:     body.proctorName    || null,
        track_id:         trackId,
        track_title:      body.trackTitle     || null,
        exam_id:          examId,
        exam_title:       body.examTitle      || null,
        exam_type:        body.examType       || null,
        exam_version:     body.examVersion    || '1.0',
        started_at:       body.startedAt      || null,
        submitted_at:     submittedAt         || new Date().toISOString(),
        duration_seconds: body.durationSeconds || null,
        total_questions:  body.totalQuestions || 0,
        answered_count:   body.answeredCount  || 0,
        flagged_count:    body.flaggedCount   || 0,
        correct_count:    body.correctCount   || 0,
        percentage:       percentage          || 0,
        passed:           !!passed,
        answers_json:     body.answersJson    || null,
        category_breakdown_json: body.categoryBreakdownJson || null,
        environment:      body.environment    || 'production',
        site_url:         body.siteUrl        || null,
      }),
    });

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      console.error('[submit-attempt] Supabase error:', supaRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: `Supabase ${supaRes.status}` }), { status: 502, headers });
    }

    const data = await supaRes.json();
    return new Response(JSON.stringify({ success: true, stored: true, data }), { status: 200, headers });

  } catch (err) {
    console.error('[submit-attempt] Unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500, headers });
  }
}
