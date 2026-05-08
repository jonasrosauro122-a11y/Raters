// =========================================================
// STORAGE MODULE — localStorage management
// =========================================================

const KEYS = {
  CURRENT_USER:    'training_current_user',
  SELECTED_TRACK:  'training_selected_track',
  SELECTED_EXAM:   'training_selected_exam',
  EXAM_DRAFT:      'training_exam_draft',
  PROGRESS:        'training_progress',
  ATTEMPT_HISTORY: 'training_attempt_history',
  ADMIN_AUTH:      'training_admin_auth',
};

export { KEYS };

// ─── Generic helpers ──────────────────────────────────────
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] write failed:', e);
  }
}

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ─── Current User ─────────────────────────────────────────
export function saveUser(user) {
  save(KEYS.CURRENT_USER, { ...user, updatedAt: new Date().toISOString() });
}

export function loadUser() {
  return load(KEYS.CURRENT_USER, null);
}

export function clearUser() {
  remove(KEYS.CURRENT_USER);
}

// ─── Track / Exam Selection ───────────────────────────────
export function saveSelectedTrack(trackId) {
  save(KEYS.SELECTED_TRACK, trackId);
}

export function loadSelectedTrack() {
  return load(KEYS.SELECTED_TRACK, null);
}

export function saveSelectedExam(examId) {
  save(KEYS.SELECTED_EXAM, examId);
}

export function loadSelectedExam() {
  return load(KEYS.SELECTED_EXAM, null);
}

// ─── Exam Draft ───────────────────────────────────────────
export function saveDraft(examId, draft) {
  const all = load(KEYS.EXAM_DRAFT, {});
  all[examId] = { ...draft, savedAt: new Date().toISOString() };
  save(KEYS.EXAM_DRAFT, all);
}

export function loadDraft(examId) {
  const all = load(KEYS.EXAM_DRAFT, {});
  return all[examId] || null;
}

export function clearDraft(examId) {
  const all = load(KEYS.EXAM_DRAFT, {});
  delete all[examId];
  save(KEYS.EXAM_DRAFT, all);
}

export function clearAllDrafts() {
  remove(KEYS.EXAM_DRAFT);
}

// ─── Progress ─────────────────────────────────────────────
export function loadProgress(traineeId = null) {
  const all = load(KEYS.PROGRESS, {});
  if (!traineeId) return all;
  return all[traineeId] || { passedExamIds: [], trackCompletion: {} };
}

export function saveProgress(traineeId, progress) {
  const all = load(KEYS.PROGRESS, {});
  all[traineeId] = { ...progress, updatedAt: new Date().toISOString() };
  save(KEYS.PROGRESS, all);
}

export function markExamPassed(traineeId, examId, trackId, score) {
  const progress = loadProgress(traineeId);
  if (!progress.passedExamIds) progress.passedExamIds = [];
  if (!progress.passedExamIds.includes(examId)) {
    progress.passedExamIds.push(examId);
  }
  if (!progress.trackCompletion) progress.trackCompletion = {};
  if (!progress.trackCompletion[trackId]) progress.trackCompletion[trackId] = {};
  progress.trackCompletion[trackId][examId] = { passed: true, score, date: new Date().toISOString() };
  saveProgress(traineeId, progress);
}

export function isExamPassed(traineeId, examId) {
  const progress = loadProgress(traineeId);
  return Array.isArray(progress.passedExamIds) && progress.passedExamIds.includes(examId);
}

// ─── Attempt History ──────────────────────────────────────
export function saveAttempt(attempt) {
  const history = load(KEYS.ATTEMPT_HISTORY, []);
  history.unshift({ ...attempt, id: Date.now(), savedAt: new Date().toISOString() });
  // Keep most recent 200
  if (history.length > 200) history.splice(200);
  save(KEYS.ATTEMPT_HISTORY, history);
}

export function loadAttemptHistory() {
  return load(KEYS.ATTEMPT_HISTORY, []);
}

export function loadAttemptsByTrainee(traineeId) {
  return loadAttemptHistory().filter(
    (a) => a.traineeId === traineeId || a.traineeName === traineeId
  );
}

export function clearAttemptHistory() {
  remove(KEYS.ATTEMPT_HISTORY);
}

// ─── Admin Auth ───────────────────────────────────────────
export function saveAdminAuth(token) {
  save(KEYS.ADMIN_AUTH, { token, at: Date.now() });
}

export function loadAdminAuth() {
  const auth = load(KEYS.ADMIN_AUTH, null);
  if (!auth) return null;
  // Expire after 8 hours
  if (Date.now() - auth.at > 8 * 60 * 60 * 1000) {
    remove(KEYS.ADMIN_AUTH);
    return null;
  }
  return auth;
}

export function clearAdminAuth() {
  remove(KEYS.ADMIN_AUTH);
}

// ─── Recent Session ───────────────────────────────────────
export function loadRecentSession() {
  const user  = loadUser();
  const track = loadSelectedTrack();
  const exam  = loadSelectedExam();
  if (!user || !track) return null;
  return { user, trackId: track, examId: exam };
}

// ─── Full reset ───────────────────────────────────────────
export function clearAll() {
  Object.values(KEYS).forEach(remove);
}
