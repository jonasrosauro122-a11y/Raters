// =========================================================
// ANIMATIONS MODULE — VA Training Exam Platform
// =========================================================

// ─── PARTICLE SYSTEM ──────────────────────────────────────
export function initParticles(canvasId = 'particles-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let raf;

  const particles = [];
  const COUNT = window.innerWidth < 768 ? 40 : 80;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      color: Math.random() > 0.5 ? '96,196,255' : '139,92,246',
    };
  }

  function init() {
    particles.length = 0;
    for (let i = 0; i < COUNT; i++) particles.push(createParticle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.pulse += p.pulseSpeed;
      const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${a})`;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    // Draw connecting lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(96,196,255,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  init();
  draw();
  window.addEventListener('resize', () => { resize(); init(); });

  return () => { cancelAnimationFrame(raf); };
}

// ─── CONFETTI SYSTEM ──────────────────────────────────────
export function launchConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '9999',
    });
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#3b82f6','#06b6d4','#8b5cf6','#10b981','#f59e0b','#f43f5e','#e0f2fe','#a5f3fc'];
  const pieces = [];
  const COUNT = 200;

  for (let i = 0; i < COUNT; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      alpha: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  let frame = 0;
  let raf;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    let alive = false;
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.vy += 0.05;
      if (frame > 120) p.alpha -= 0.01;
      if (p.alpha <= 0) return;
      alive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });

    if (alive) {
      raf = requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  draw();
}

// ─── COUNT-UP ANIMATION ──────────────────────────────────
export function animateCountUp(el, from, to, duration = 1500, suffix = '') {
  if (!el) return;
  const start = performance.now();
  const range = to - from;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + range * ease);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ─── PROGRESS RING ANIMATOR ──────────────────────────────
export function animateProgressRing(svgEl, percentage, duration = 800) {
  const circle = svgEl?.querySelector('.progress-ring-fill');
  if (!circle) return;

  const r = parseFloat(circle.getAttribute('r') || '40');
  const circumference = 2 * Math.PI * r;
  circle.style.strokeDasharray = circumference;

  const targetOffset = circumference * (1 - percentage / 100);
  circle.style.strokeDashoffset = circumference;

  setTimeout(() => {
    circle.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.34,1.56,0.64,1)`;
    circle.style.strokeDashoffset = targetOffset;
  }, 50);
}

// ─── STAGGER ENTRANCE ────────────────────────────────────
export function staggerEntrance(parentEl, selector = '.glass-card, .track-card, .exam-card', baseDelay = 60) {
  if (!parentEl) return;
  const items = parentEl.querySelectorAll(selector);
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * baseDelay + 80);
  });
}

// ─── CATEGORY BAR ANIMATION ──────────────────────────────
export function animateCategoryBars(containerEl) {
  if (!containerEl) return;
  const bars = containerEl.querySelectorAll('.category-bar-fill');
  bars.forEach((bar, i) => {
    const target = bar.dataset.width || '0%';
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = `width 0.7s cubic-bezier(0.34,1.56,0.64,1)`;
      bar.style.width = target;
    }, i * 100 + 200);
  });
}

// ─── SMOOTH PAGE TRANSITION ──────────────────────────────
export function pageTransition(callback) {
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(8px)';
  document.body.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  setTimeout(() => {
    if (callback) callback();
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  }, 200);
}

// ─── GLITCH TEXT EFFECT ──────────────────────────────────
export function glitchText(el, duration = 600) {
  if (!el) return;
  const original = el.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let iterations = 0;
  const maxIterations = Math.ceil(duration / 40);

  const interval = setInterval(() => {
    el.textContent = original.split('').map((char, i) => {
      if (i < iterations / maxIterations * original.length) return char;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');

    if (iterations >= maxIterations) {
      el.textContent = original;
      clearInterval(interval);
    }
    iterations++;
  }, 40);
}

// ─── RIPPLE EFFECT ───────────────────────────────────────
export function addRippleEffect(el) {
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    Object.assign(ripple.style, {
      position: 'absolute',
      width: size + 'px',
      height: size + 'px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      transform: 'scale(0)',
      left: (e.clientX - rect.left - size / 2) + 'px',
      top:  (e.clientY - rect.top  - size / 2) + 'px',
      animation: 'ripple-anim 0.6s ease forwards',
      pointerEvents: 'none',
    });

    if (!document.querySelector('#ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes ripple-anim { to { transform: scale(2); opacity: 0; } }';
      document.head.appendChild(style);
    }

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// ─── HOVER GLOW ──────────────────────────────────────────
export function addHoverGlow(el, color = 'rgba(59,130,246,0.3)') {
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = `0 0 30px ${color}, 0 0 60px ${color.replace('0.3','0.15')}`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = '';
  });
}

// ─── SCROLL REVEAL ────────────────────────────────────────
export function initScrollReveal(selector = '.glass-card, .track-card, .stat-card') {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll(selector).forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// ─── TIMER RING ANIMATION ────────────────────────────────
export function createTimerRing(container, totalSeconds) {
  const size = 80;
  const r = 34;
  const circumference = 2 * Math.PI * r;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.style.transform = 'rotate(-90deg)';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', 'timerGrad');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#3b82f6');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#06b6d4');
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', size / 2); track.setAttribute('cy', size / 2);
  track.setAttribute('r', r); track.setAttribute('fill', 'none');
  track.setAttribute('stroke', 'rgba(59,130,246,0.1)'); track.setAttribute('stroke-width', '4');

  const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  fill.setAttribute('cx', size / 2); fill.setAttribute('cy', size / 2);
  fill.setAttribute('r', r); fill.setAttribute('fill', 'none');
  fill.setAttribute('stroke', 'url(#timerGrad)'); fill.setAttribute('stroke-width', '4');
  fill.setAttribute('stroke-linecap', 'round');
  fill.setAttribute('stroke-dasharray', circumference);
  fill.setAttribute('stroke-dashoffset', '0');
  fill.style.transition = 'stroke-dashoffset 1s linear, stroke 0.5s ease';

  svg.appendChild(track);
  svg.appendChild(fill);
  container.appendChild(svg);

  return {
    update(remainingSeconds) {
      const ratio = remainingSeconds / totalSeconds;
      const offset = circumference * (1 - ratio);
      fill.setAttribute('stroke-dashoffset', offset);

      if (ratio <= 0.1) {
        fill.setAttribute('stroke', '#f43f5e');
        stop1.setAttribute('stop-color', '#f43f5e');
        stop2.setAttribute('stop-color', '#e11d48');
      } else if (ratio <= 0.25) {
        fill.setAttribute('stroke', '#f59e0b');
        stop1.setAttribute('stop-color', '#f59e0b');
        stop2.setAttribute('stop-color', '#d97706');
      }
    },
  };
}

// ─── LOADING SKELETON ────────────────────────────────────
export function createSkeleton(lines = 3) {
  const wrap = document.createElement('div');
  wrap.className = 'skeleton-wrap';
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:20px;';

  for (let i = 0; i < lines; i++) {
    const line = document.createElement('div');
    const width = i === 0 ? '60%' : i === lines - 1 ? '40%' : '90%';
    line.style.cssText = `height:14px;background:rgba(59,130,246,0.08);border-radius:4px;width:${width};animation:skeleton-pulse 1.5s ease infinite ${i * 0.15}s;`;
    wrap.appendChild(line);
  }

  if (!document.querySelector('#skeleton-style')) {
    const style = document.createElement('style');
    style.id = 'skeleton-style';
    style.textContent = '@keyframes skeleton-pulse{0%,100%{opacity:0.4}50%{opacity:1}}';
    document.head.appendChild(style);
  }

  return wrap;
}
