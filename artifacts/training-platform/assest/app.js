// =========================================================
// APP.JS — Main coordinator (page detection + init)
// =========================================================

import { initParticles } from './animations.js';

// Initialise background particles on every page
document.addEventListener('DOMContentLoaded', () => {
  initParticles('particles-canvas');

  // Page-enter animation
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(6px)';
  document.body.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  });
});
