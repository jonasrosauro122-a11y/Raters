// =========================================================
// UI MODULE — reusable rendering functions
// =========================================================

import { EXAM_TYPE_LABELS, EXAM_TYPE_ORDER } from '../data/exams.js';

// ─── Toast notifications ──────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 280);
  }, duration);

  return toast;
}

// ─── Modal ────────────────────────────────────────────────
export function openModal({ title, body, actions = [], onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const actionHtml = actions.map((a) =>
    `<button class="btn ${a.class || 'btn-secondary'}" data-action="${a.key}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal-box animate-scale-in">
      <h2 class="modal-title">${title}</h2>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actionHtml}</div>
    </div>
  `;

  overlay.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = actions.find((a) => a.key === btn.dataset.action);
      if (action?.handler) action.handler();
      overlay.remove();
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { overlay.remove(); onClose?.(); }
  });

  document.body.appendChild(overlay);
  return overlay;
}

// ─── Render track cards ───────────────────────────────────
export function renderTrackCard(track, isActive, onClick) {
  const card = document.createElement('div');
  card.className = `track-card${isActive ? ' active' : ''}`;
  card.style.setProperty('--track-color', track.accentColor);

  card.style.cssText += `
    --track-glow: ${track.glowColor};
  `;

  card.innerHTML = `
    <style>
      .track-card[data-id="${track.id}"]::before {
        background: linear-gradient(90deg, ${track.accentColor}, transparent);
      }
    </style>
    <span class="track-card-icon">${track.icon}</span>
    <div class="track-card-title">${track.title}</div>
    <div class="track-card-subtitle">${track.subtitle}</div>
    <div class="track-card-desc">${track.description}</div>
    <div class="flex items-center gap-2 flex-wrap">
      ${track.categories.slice(0, 3).map((c) =>
        `<span style="font-size:0.72rem;padding:2px 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:var(--text-secondary)">${c}</span>`
      ).join('')}
      ${track.categories.length > 3 ? `<span style="font-size:0.72rem;color:var(--text-muted)">+${track.categories.length - 3} more</span>` : ''}
    </div>
    ${isActive ? `<div style="margin-top:14px;font-size:0.78rem;font-weight:700;color:${track.accentColor};letter-spacing:0.05em;text-transform:uppercase">✓ Selected</div>` : ''}
  `;

  card.dataset.id = track.id;
  card.addEventListener('click', () => onClick(track));
  return card;
}

// ─── Render exam card ─────────────────────────────────────
export function renderExamCard(exam, status, lockReason, onClick) {
  const isLocked = status === 'locked';
  const card = document.createElement('div');
  card.className = `exam-card${isLocked ? ' locked' : ''}`;

  const statusBadge = renderStatusBadge(status);
  const typeLabel   = EXAM_TYPE_LABELS[exam.examType] || exam.examType;

  card.innerHTML = `
    <div class="exam-card-type">${typeLabel}</div>
    <div class="exam-card-title">${exam.title}</div>
    <div class="exam-card-meta">
      <div class="exam-card-meta-row">
        <span>⏱</span>
        <span>${exam.durationMinutes} min</span>
      </div>
      <div class="exam-card-meta-row">
        <span>🎯</span>
        <span>${exam.passingScore}% to pass</span>
      </div>
      ${exam.attemptLimit < 99 ? `
      <div class="exam-card-meta-row">
        <span>🔄</span>
        <span>Max ${exam.attemptLimit} attempt${exam.attemptLimit > 1 ? 's' : ''}</span>
      </div>` : ''}
    </div>
    ${statusBadge}
    ${isLocked ? `
      <div class="lock-overlay">
        <div class="lock-icon">🔒</div>
        <div class="lock-reason">${lockReason || 'Complete prerequisites first'}</div>
      </div>` : ''}
  `;

  if (!isLocked) {
    card.addEventListener('click', () => onClick(exam));
    card.style.cursor = 'pointer';
  }

  return card;
}

export function renderStatusBadge(status) {
  const map = {
    locked:      { cls: 'badge-locked',      label: '🔒 Locked' },
    available:   { cls: 'badge-available',   label: '🟢 Available' },
    practice:    { cls: 'badge-practice',    label: '📝 Practice' },
    in_progress: { cls: 'badge-in-progress', label: '⏳ In Progress' },
    passed:      { cls: 'badge-passed',      label: '✅ Passed' },
    failed:      { cls: 'badge-failed',      label: '❌ Failed' },
    completed:   { cls: 'badge-completed',   label: '✔ Completed' },
  };
  const info = map[status] || map.available;
  return `<span class="badge ${info.cls}">${info.label}</span>`;
}

// ─── Render question ──────────────────────────────────────
export function renderQuestion(question, index, total, selectedAnswer) {
  const container = document.createElement('div');
  container.className = 'question-card';

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const typeBadge = question.type === 'true-false'
    ? '<span class="badge badge-practice">True / False</span>'
    : '<span class="badge badge-available">Multiple Choice</span>';

  container.innerHTML = `
    <div class="question-meta">
      <span class="text-muted text-sm">Question ${index + 1} of ${total}</span>
      ${typeBadge}
      <span class="badge badge-${question.difficulty}">${question.difficulty}</span>
      <span class="badge" style="background:rgba(99,102,241,0.12);color:#a5b4fc;border-color:rgba(99,102,241,0.25)">
        ${question.category}
      </span>
    </div>
    <div class="question-prompt">${question.prompt}</div>
    <div class="choices-list">
      ${question.choices.map((choice, ci) => `
        <div class="choice-item${selectedAnswer === ci ? ' selected' : ''}" data-index="${ci}">
          <div class="choice-letter">${letters[ci] || ci}</div>
          <div class="choice-text">${choice}</div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.choice-item').forEach((el) => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.choice-item').forEach((c) => c.classList.remove('selected'));
      el.classList.add('selected');
      const evt = new CustomEvent('answer-selected', { detail: { index: parseInt(el.dataset.index) }, bubbles: true });
      container.dispatchEvent(evt);
    });
  });

  return container;
}

// ─── Render question in review mode ──────────────────────
export function renderQuestionReview(question, givenAnswer, showExplanation = false) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const isCorrect = givenAnswer === question.correctAnswer;

  const choices = question.choices.map((c, ci) => {
    let cls = 'choice-item';
    if (ci === question.correctAnswer) cls += ' correct';
    else if (ci === givenAnswer && !isCorrect) cls += ' incorrect';

    return `
      <div class="${cls}">
        <div class="choice-letter">${letters[ci]}</div>
        <div class="choice-text">${c}</div>
        ${ci === question.correctAnswer ? '<span style="margin-left:auto;font-size:0.9rem">✅</span>' : ''}
        ${ci === givenAnswer && !isCorrect ? '<span style="margin-left:auto;font-size:0.9rem">❌</span>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="question-prompt">${question.prompt}</div>
    <div class="choices-list">${choices}</div>
    ${showExplanation && question.explanation ? `
      <div class="explanation-box">
        <strong style="color:var(--text-accent);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.06em">Explanation</strong>
        <div style="margin-top:6px">${question.explanation}</div>
      </div>` : ''}
  `;
}

// ─── Render category breakdown bars ───────────────────────
export function renderCategoryBreakdown(breakdown, container) {
  container.innerHTML = '';
  breakdown.forEach((cat) => {
    const row = document.createElement('div');
    row.className = 'category-breakdown';
    row.innerHTML = `
      <div class="category-row">
        <span class="category-name">${cat.category}</span>
        <span class="category-score">${cat.correct}/${cat.total} (${cat.percentage}%)</span>
      </div>
      <div class="category-bar-wrap">
        <div class="category-bar-fill" data-width="${cat.percentage}%" style="width:0%"></div>
      </div>
    `;
    container.appendChild(row);
  });

  // Trigger animation
  requestAnimationFrame(() => {
    container.querySelectorAll('.category-bar-fill').forEach((bar) => {
      setTimeout(() => {
        bar.style.transition = 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)';
        bar.style.width = bar.dataset.width;
      }, 100);
    });
  });
}

// ─── Stats card ───────────────────────────────────────────
export function renderStatCard(icon, value, label, color = 'var(--accent-blue)') {
  return `
    <div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value" style="color:${color}">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

// ─── Attempt table row ─────────────────────────────────────
export function renderAttemptRow(attempt) {
  const date = new Date(attempt.submittedAt || attempt.savedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const passClass = attempt.passed ? 'text-success' : 'text-danger';
  const passText  = attempt.passed ? '✅ Passed' : '❌ Failed';

  return `
    <tr>
      <td><strong class="text-primary">${attempt.traineeName || '—'}</strong></td>
      <td>${attempt.traineeIdBadge || '—'}</td>
      <td>${attempt.trackTitle || '—'}</td>
      <td>${attempt.examTitle || '—'}</td>
      <td><strong class="${passClass}">${attempt.percentage || 0}%</strong></td>
      <td><span class="${passClass}">${passText}</span></td>
      <td class="text-muted text-sm">${date}</td>
    </tr>
  `;
}

// ─── Loading state ────────────────────────────────────────
export function setLoading(el, isLoading, text = 'Loading...') {
  if (!el) return;
  if (isLoading) {
    el._originalHTML = el.innerHTML;
    el.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div><div>${text}</div></div>`;
  } else if (el._originalHTML !== undefined) {
    el.innerHTML = el._originalHTML;
    delete el._originalHTML;
  }
}

// ─── Empty state ──────────────────────────────────────────
export function renderEmptyState(icon, title, body) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-body">${body}</div>
    </div>
  `;
}

// ─── Progress ring SVG ────────────────────────────────────
export function createProgressRingSVG(percentage, size = 90, strokeWidth = 6) {
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percentage / 100);

  return `
    <div class="progress-ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" class="progress-ring">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
        <circle class="progress-ring-track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${strokeWidth}"/>
        <circle class="progress-ring-fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${strokeWidth}"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="progress-ring-label">
        <div style="font-size:${size < 60 ? '0.75' : '1'}rem;font-weight:900;color:var(--text-primary)">${percentage}%</div>
      </div>
    </div>
  `;
}

// ─── Keyboard shortcut hint bar ───────────────────────────
export function renderShortcutsHint(shortcuts = []) {
  if (!shortcuts.length) return '';
  return `
    <div class="flex items-center gap-3 flex-wrap" style="font-size:0.78rem;color:var(--text-muted);padding:8px 0">
      ${shortcuts.map((s) => `<span class="flex items-center gap-1">${s.keys.map((k) => `<kbd class="kbd">${k}</kbd>`).join('')} ${s.action}</span>`).join('<span>·</span>')}
    </div>
  `;
}

// ─── Exam countdown status ────────────────────────────────
export function getTimerClass(remainingSeconds, totalSeconds) {
  const ratio = remainingSeconds / totalSeconds;
  if (ratio <= 0.1) return 'danger';
  if (ratio <= 0.25) return 'warning';
  return '';
}

// ─── Track pill ───────────────────────────────────────────
export function renderTrackPill(track) {
  return `
    <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;
      background:${track.glowColor};border:1px solid ${track.accentColor}40;
      font-size:0.78rem;font-weight:700;color:${track.accentColor}">
      ${track.icon} ${track.title}
    </span>
  `;
}
