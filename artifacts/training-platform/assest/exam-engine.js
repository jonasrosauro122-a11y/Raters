// =========================================================
// EXAM ENGINE — scoring, shuffling, progression logic
// =========================================================

import { getQuestionsByExam } from '../data/question-bank.js';
import { getExamById } from '../data/exams.js';
import { isExamPassed } from './storage.js';

// ─── Shuffle array (Fisher-Yates) ─────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Prepare questions for an exam session ─────────────────
export function prepareExamQuestions(examId) {
  const exam = getExamById(examId);
  if (!exam) return [];

  let questions = getQuestionsByExam(examId);

  if (exam.shuffleQuestions) {
    questions = shuffle(questions);
  }

  if (exam.randomizeChoices) {
    questions = questions.map((q) => {
      if (q.type !== 'multiple-choice') return q;
      const indexed = q.choices.map((c, i) => ({ text: c, originalIndex: i }));
      const shuffled = shuffle(indexed);
      const newCorrect = shuffled.findIndex((c) => c.originalIndex === q.correctAnswer);
      return {
        ...q,
        choices: shuffled.map((c) => c.text),
        correctAnswer: newCorrect,
      };
    });
  }

  return questions;
}

// ─── Score an attempt ─────────────────────────────────────
export function scoreAttempt(questions, answers) {
  let correct = 0;
  const perQuestion = questions.map((q, i) => {
    const given   = answers[i];
    const isRight = given !== undefined && given !== null && given === q.correctAnswer;
    if (isRight) correct++;
    return {
      questionId: q.id,
      category:   q.category,
      correct:    isRight,
      given,
      expected:   q.correctAnswer,
      points:     q.points || 1,
    };
  });

  const total      = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, total, percentage, perQuestion };
}

// ─── Category breakdown ───────────────────────────────────
export function getCategoryBreakdown(perQuestion, questions) {
  const cats = {};

  perQuestion.forEach((r, i) => {
    const cat = r.category || questions[i]?.category || 'General';
    if (!cats[cat]) cats[cat] = { correct: 0, total: 0 };
    cats[cat].total++;
    if (r.correct) cats[cat].correct++;
  });

  return Object.entries(cats).map(([category, data]) => ({
    category,
    correct:    data.correct,
    total:      data.total,
    percentage: Math.round((data.correct / data.total) * 100),
  }));
}

// ─── Check if exam is unlocked ────────────────────────────
export function isExamUnlocked(exam, traineeId) {
  if (!exam.unlockRule) return true;
  return isExamPassed(traineeId, exam.unlockRule);
}

// ─── Get lock reason text ─────────────────────────────────
export function getLockReason(exam, examList) {
  if (!exam.unlockRule) return null;
  const prereq = examList.find((e) => e.id === exam.unlockRule);
  return prereq ? `Pass "${prereq.title}" to unlock this exam` : 'Complete prerequisites first';
}

// ─── Did trainee pass a specific exam ────────────────────
export function didPass(percentage, passingScore) {
  return percentage >= passingScore;
}

// ─── Format timer ─────────────────────────────────────────
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Build attempt object ─────────────────────────────────
export function buildAttemptRecord({
  user, exam, track, questions, answers,
  startedAt, submittedAt, flagged = [],
}) {
  const scored    = scoreAttempt(questions, answers);
  const breakdown = getCategoryBreakdown(scored.perQuestion, questions);
  const passed    = didPass(scored.percentage, exam.passingScore);
  const durationSec = submittedAt && startedAt
    ? Math.round((new Date(submittedAt) - new Date(startedAt)) / 1000)
    : null;

  return {
    traineeId:             user.id || user.name,
    traineeName:           user.name,
    traineeIdBadge:        user.idBadge || '',
    proctorName:           user.proctor || '',
    trackId:               track.id,
    trackTitle:            track.title,
    examId:                exam.id,
    examTitle:             exam.title,
    examType:              exam.examType,
    examVersion:           exam.version,
    startedAt,
    submittedAt:           submittedAt || new Date().toISOString(),
    durationSeconds:       durationSec,
    totalQuestions:        scored.total,
    answeredCount:         Object.values(answers).filter((v) => v !== null && v !== undefined).length,
    flaggedCount:          flagged.length,
    correctCount:          scored.correct,
    percentage:            scored.percentage,
    passed,
    answersJson:           answers,
    categoryBreakdownJson: breakdown,
    environment:           window.location.hostname === 'localhost' ? 'development' : 'production',
    siteUrl:               window.location.origin,
  };
}

// ─── Validate answers (check for unanswered) ──────────────
export function getUnansweredIndices(questions, answers) {
  return questions
    .map((_, i) => i)
    .filter((i) => answers[i] === null || answers[i] === undefined);
}

export function getFlaggedIndices(flaggedSet) {
  return Array.from(flaggedSet);
}

// ─── Attempt limit check ──────────────────────────────────
export function getAttemptCount(history, examId, traineeId) {
  return history.filter(
    (a) => a.examId === examId &&
    (a.traineeId === traineeId || a.traineeName === traineeId)
  ).length;
}

export function isAttemptLimitReached(exam, history, traineeId) {
  if (!exam.attemptLimit || exam.attemptLimit >= 99) return false;
  return getAttemptCount(history, exam.id, traineeId) >= exam.attemptLimit;
}
