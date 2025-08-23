// Utilities
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

// Footer year
$('#year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = $('.nav-toggle');
const siteNav = $('#siteNav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Smooth scroll for in-page links
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id && id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        siteNav.classList.remove('open');
        navToggle?.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
$$('.reveal').forEach(el => revealObserver.observe(el));

// Hero: fake anomaly counter
(function animateAnomalies() {
  const el = $('#anomalyCount');
  let count = 0;
  setInterval(() => {
    count = (count + Math.floor(Math.random() * 3)) % 120;
    if (el) el.textContent = String(count);
  }, 1200);
})();

// Dashboard controls
const dashboard = $('#dashboard');
const openDashBtns = $$('[data-open-dashboard]');
const closeBtn = $('#dashboardClose');
const backdrop = $('.dashboard-backdrop');
let lastFocus = null;

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  document.body.style.overflow = lock ? 'hidden' : '';
}

function trapFocus(container, event) {
  const focusable = $$('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])', container)
    .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openDashboard() {
  if (!dashboard) return;
  lastFocus = document.activeElement;
  dashboard.classList.add('active');
  dashboard.setAttribute('aria-hidden', 'false');
  lockScroll(true);
  const firstInput = $('#lessonSearch') || $('#dashboardClose');
  firstInput?.focus();
  if (location.hash !== '#dashboard') history.pushState(null, '', '#dashboard');
}
function closeDashboard() {
  if (!dashboard) return;
  dashboard.classList.remove('active');
  dashboard.setAttribute('aria-hidden', 'true');
  lockScroll(false);
  if (location.hash === '#dashboard') history.pushState(null, '', ' ');
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}
openDashBtns.forEach(btn => btn.addEventListener('click', () => {
  siteNav.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  openDashboard();
}));
[closeBtn, backdrop].forEach(el => el?.addEventListener('click', closeDashboard));

// Focus trap within dashboard
if (dashboard) {
  dashboard.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && dashboard.classList.contains('active')) {
      trapFocus(dashboard, e);
    }
  });
}

// Hash support for direct open
window.addEventListener('load', () => {
  if (location.hash === '#dashboard') openDashboard();
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#dashboard') openDashboard();
  else if (dashboard?.classList.contains('active')) closeDashboard();
});

// Lessons data
const lessons = [
  { id: 'net-01', title: 'Networking Basics', level: 'Beginner', tags: ['Network'], description: 'OSI model, TCP/UDP, ports, scanning intro.' },
  { id: 'web-01', title: 'OWASP Top 10 Primer', level: 'Beginner', tags: ['Web'], description: 'Common web vulns and how to think about them.' },
  { id: 'crypt-01', title: 'Crypto Fundamentals', level: 'Beginner', tags: ['Crypto'], description: 'Hashes, symmetric/asymmetric, common pitfalls.' },
  { id: 'blue-01', title: 'Log Analysis Basics', level: 'Beginner', tags: ['Blue', 'SIEM'], description: 'Read logs, find IOCs, intro to SIEM.' },
  { id: 'red-01', title: 'Burp Suite Essentials', level: 'Intermediate', tags: ['Red', 'Web'], description: 'Proxy, repeater, intruder, basic workflows.' },
  { id: 'net-02', title: 'Pivoting & Tunneling', level: 'Intermediate', tags: ['Network', 'Red'], description: 'SOCKS, SSH, chisel, bouncing through hosts.' },
  { id: 'cloud-01', title: 'Cloud IAM Hardening', level: 'Intermediate', tags: ['Cloud', 'IAM'], description: 'Principle of least privilege, common misconfigs.' },
  { id: 'dfir-01', title: 'Memory Forensics Intro', level: 'Intermediate', tags: ['DFIR'], description: 'Volatility basics and typical artifacts.' },
  { id: 'web-02', title: 'IDOR Deep Dive', level: 'Advanced', tags: ['Web', 'Red'], description: 'Enumeration, exploitation, and remediation strategies.' },
  { id: 're-01', title: 'Reverse Engineering ELF', level: 'Advanced', tags: ['RE', 'Linux'], description: 'Strings, symbols, flow, patching challenges.' },
  { id: 'blue-02', title: 'Detections: Credential Dumping', level: 'Advanced', tags: ['Blue', 'SIEM'], description: 'Sigma rules, testing, tuning false positives.' },
  { id: 'cloud-02', title: 'Kubernetes Security', level: 'Advanced', tags: ['Cloud', 'Containers'], description: 'RBAC, policies, runtime protections.' },
];

// Build tag universe
const tagUniverse = Array.from(new Set(lessons.flatMap(l => l.tags))).sort();
const tagFilterEl = $('#tagFilter');
if (tagFilterEl) {
  tagUniverse.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.dataset.tag = tag;
    tagFilterEl.appendChild(span);
  });
}

// Local storage for progress
const STORAGE_KEY = 'cyberlearn-progress-v1';
function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveProgress(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}
let completed = loadProgress();

// Rendering
const lessonsGrid = $('#lessonsGrid');
const searchInput = $('#lessonSearch');
const levelCheckboxes = $$('input[name="level"]');
const progressLabel = $('#progressLabel');
const progressBar = $('#progressBar');
const resetBtn = $('#resetProgress');

function computeProgress(filtered) {
  if (filtered.length === 0) return 0;
  const done = filtered.filter(l => completed.has(l.id)).length;
  return Math.round((done / filtered.length) * 100);
}

function updateProgressUI(filtered) {
  const pct = computeProgress(filtered);
  if (progressLabel) progressLabel.textContent = `Progress: ${pct}%`;
  if (progressBar) progressBar.style.width = pct + '%';
}

function getActiveFilters() {
  const q = (searchInput?.value || '').toLowerCase().trim();
  const levels = levelCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
  const activeTags = $$('#tagFilter span.active').map(s => s.dataset.tag);
  return { q, levels, tags: activeTags };
}

function filterLessons() {
  const { q, levels, tags } = getActiveFilters();
  return lessons.filter(l => {
    const matchesQuery = !q ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q));
    const matchesLevel = levels.includes(l.level);
    const matchesTags = tags.length === 0 || tags.every(t => l.tags.includes(t));
    return matchesQuery && matchesLevel && matchesTags;
  });
}

function renderLessons() {
  if (!lessonsGrid) return;
  const filtered = filterLessons();
  lessonsGrid.innerHTML = '';
  filtered.forEach(l => {
    const card = document.createElement('article');
    card.className = 'card lesson';
    card.innerHTML = `
      <div class="card-body">
        <div class="meta">
          <h3>${l.title}</h3>
          <span class="level">${l.level}</span>
        </div>
        <p>${l.description}</p>
        <div class="tags">${l.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="actions">
          <label class="mark"><input type="checkbox" ${completed.has(l.id) ? 'checked' : ''} data-id="${l.id}" /> Mark complete</label>
          <button class="btn btn-small btn-accent" data-preview="${l.id}">Open</button>
        </div>
      </div>
    `;
    lessonsGrid.appendChild(card);
  });
  updateProgressUI(filtered);
}

// Events: search, filters, tags
searchInput?.addEventListener('input', renderLessons);
levelCheckboxes.forEach(cb => cb.addEventListener('change', renderLessons));

tagFilterEl?.addEventListener('click', (e) => {
  const span = e.target.closest('span');
  if (!span) return;
  span.classList.toggle('active');
  renderLessons();
});

// Events: mark complete, preview
lessonsGrid?.addEventListener('change', (e) => {
  const input = e.target.closest('input[type="checkbox"][data-id]');
  if (!input) return;
  const id = input.getAttribute('data-id');
  if (input.checked) completed.add(id); else completed.delete(id);
  saveProgress(completed);
  renderLessons();
});

$('#resetProgress')?.addEventListener('click', () => {
  if (confirm('Reset your lesson progress?')) {
    completed = new Set();
    saveProgress(completed);
    renderLessons();
  }
});

// Render initial
renderLessons();

// Keyboard: Esc to close dashboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dashboard?.classList.contains('active')) closeDashboard();
});