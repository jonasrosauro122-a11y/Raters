// =========================================================
// NETLIFY FUNCTION: get-attempts
// Admin-only endpoint to fetch exam submissions from Supabase.
// =========================================================

export const config = { path: '/api/get-attempts' };

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_TOKEN   = process.env.ADMIN_TOKEN || 'trainer2024';
const TABLE         = 'exam_attempts';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
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

  // Health check
  if (params.get('_health') === '1') {
    return new Response(JSON.stringify({ ok: true, supabase: !!SUPABASE_URL }), { status: 200, headers });
  }

  // Auth gate
  const token = params.get('_token') || req.headers.get('x-admin-token') || '';
  if (token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  // No Supabase → return empty (UI falls back to localStorage)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(JSON.stringify({ success: true, attempts: [], reason: 'Supabase not configured' }), { status: 200, headers });
  }

  // Build Supabase query
  const queryParts = ['select=*', 'order=submitted_at.desc', 'limit=500'];

  const name      = params.get('name');
  const trackId   = params.get('trackId');
  const examType  = params.get('examType');
  const result    = params.get('result');
  const dateFrom  = params.get('dateFrom');

  if (name)     queryParts.push(`trainee_name=ilike.*${encodeURIComponent(name)}*`);
  if (trackId)  queryParts.push(`track_id=eq.${encodeURIComponent(trackId)}`);
  if (examType) queryParts.push(`exam_type=eq.${encodeURIComponent(examType)}`);
  if (result === 'passed') queryParts.push('passed=eq.true');
  if (result === 'failed') queryParts.push('passed=eq.false');
  if (dateFrom) queryParts.push(`submitted_at=gte.${encodeURIComponent(dateFrom)}`);

  try {
    const supaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?${queryParts.join('&')}`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      console.error('[get-attempts] Supabase error:', supaRes.status, errText);
      return new Response(JSON.stringify({ success: false, error: `Supabase ${supaRes.status}` }), { status: 502, headers });
    }

    const rows = await supaRes.json();

    // Normalize snake_case → camelCase for frontend
    const attempts = rows.map((r) => ({
      id:                    r.id,
      traineeName:           r.trainee_name,
      traineeIdBadge:        r.trainee_id_badge,
      proctorName:           r.proctor_name,
      trackId:               r.track_id,
      trackTitle:            r.track_title,
      examId:                r.exam_id,
      examTitle:             r.exam_title,
      examType:              r.exam_type,
      examVersion:           r.exam_version,
      startedAt:             r.started_at,
      submittedAt:           r.submitted_at,
      durationSeconds:       r.duration_seconds,
      totalQuestions:        r.total_questions,
      answeredCount:         r.answered_count,
      flaggedCount:          r.flagged_count,
      correctCount:          r.correct_count,
      percentage:            r.percentage,
      passed:                r.passed,
      answersJson:           r.answers_json,
      categoryBreakdownJson: r.category_breakdown_json,
      environment:           r.environment,
      siteUrl:               r.site_url,
    }));

    return new Response(JSON.stringify({ success: true, attempts, count: attempts.length }), { status: 200, headers });

  } catch (err) {
    console.error('[get-attempts] Unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500, headers });
  }
}
