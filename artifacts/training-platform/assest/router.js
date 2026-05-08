// =========================================================
// ROUTER MODULE — client-side navigation
// =========================================================

import { saveSelectedTrack, saveSelectedExam } from './storage.js';

export function navigateTo(page, params = {}) {
  const base = getBasePath();

  if (params.trackId) saveSelectedTrack(params.trackId);
  if (params.examId)  saveSelectedExam(params.examId);

  const url = buildUrl(base, page, params);

  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease';

  setTimeout(() => {
    window.location.href = url;
  }, 180);
}

export function getBasePath() {
  const path = window.location.pathname;
  // Find the directory portion — e.g. /my-app/exam.html → /my-app/
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash + 1) : '/';
}

function buildUrl(base, page, params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.set(k, v);
  });
  const qs = search.toString();
  return `${base}${page}${qs ? '?' + qs : ''}`;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function getAllQueryParams() {
  const result = {};
  new URLSearchParams(window.location.search).forEach((v, k) => { result[k] = v; });
  return result;
}

export function goHome() {
  navigateTo('index.html');
}

export function goToExam(trackId, examId) {
  navigateTo('exam.html', { trackId, examId });
}

export function goToResults(examId) {
  navigateTo('results.html', { examId });
}

export function goToAdmin() {
  navigateTo('admin.html');
}

export function currentPage() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}
